import { join } from 'path';
import { DepGraph } from 'dependency-graph';
import { YarnWorkspace, LernaWorkspace, WorkspaceClient } from './workspace';
import { Parser } from './parser';
import { PackageNode } from './packages';
import * as semver from 'semver';

export interface ChangeInfo {
  name: string;
  source: string;
  from: string;
  to: string;
}

export class Manager {
  private workspace!: WorkspaceClient;
  private parser = new Parser();
  private graph = new DepGraph<PackageNode>({
    circular: false,
  });

  async setVersion(name: string, version: string): Promise<ChangeInfo[]> {
    const dependants = await this.dependantsOf(name);
    const requested = await this.getPackage(name);
    const updated: ChangeInfo[] = [];

    if (requested.isLocal()) {
      if (!semver.eq(requested.version, version)) {
        updated.push({
          name,
          source: name,
          from: requested.version,
          to: version,
        });
        await requested.setVersion(version);
      }
    }

    await Promise.all(
      dependants.map(async dependant => {
        const node = await this.getPackage(dependant);
        const from = await node.versionOfDependency(name);

        if (!semver.eq(from, version)) {
          updated.push({
            name,
            source: dependant,
            from,
            to: version,
          });
          await node.updateDependency(name, version);
        }
      }),
    );

    return updated;
  }

  async getVersion(name: string): Promise<string> {
    const requested = await this.getPackage(name);

    return requested.version;
  }

  async fetchVersion(name: string, tag: string): Promise<string> {
    const requested = await this.getPackage(name);

    return requested.fetchVersion(tag);
  }

  private async getWorkspace(): Promise<WorkspaceClient> {
    if (this.workspace) {
      return this.workspace;
    }

    const name = await this.whichWorkspace();

    switch (name) {
      case 'yarn':
        this.workspace = new YarnWorkspace();
        break;
      case 'lerna':
        this.workspace = new LernaWorkspace();
        break;
      default:
        throw new Error('Not supported workspace, use either Yarn or Lerna');
    }

    return this.workspace;
  }

  private async whichWorkspace(): Promise<string> {
    const pkg: any = await this.parser.parse('package.json');

    if (pkg.workspaces) {
      return 'yarn';
    }

    return 'lerna';
  }

  private async getGraph() {
    if (!this.graph.size()) {
      this.createGraph(await this.getNodes());
    }

    return this.graph;
  }

  private async dependantsOf(name: string) {
    const graph = await this.getGraph();

    return graph.dependantsOf(name);
  }

  private async getPackage(name: string) {
    const graph = await this.getGraph();

    return graph.getNodeData(name);
  }

  private async getNodes(): Promise<PackageNode[]> {
    const workspace = await this.getWorkspace();
    const nodes: PackageNode[] = [];
    const packagesMap = await workspace.info();

    const rootPackage = await this.parser.parse('package.json');

    nodes.push(new PackageNode(rootPackage, 'package.json', true));

    for (const packageName in packagesMap) {
      if (packagesMap.hasOwnProperty(packageName)) {
        const { location } = packagesMap[packageName];
        const packageJsonPath = join(location, 'package.json');
        const packageJson = await this.parser.parse(packageJsonPath);

        nodes.push(new PackageNode(packageJson, packageJsonPath, true));
      }
    }

    return nodes;
  }

  private createGraph(nodes: PackageNode[]) {
    nodes.forEach(node => {
      this.graph.addNode(node.name, node);

      if (node.dependencies) {
        for (const name in node.dependencies) {
          if (node.dependencies.hasOwnProperty(name)) {
            if (nodes.some(n => n.name === name)) {
              return;
            }
            const version = node.dependencies[name];

            this.graph.addNode(
              name,
              new PackageNode({ name, version }, null, false),
            );
          }
        }
      }

      if (node.devDependencies) {
        for (const name in node.devDependencies) {
          if (node.devDependencies.hasOwnProperty(name)) {
            if (nodes.some(n => n.name === name)) {
              return;
            }
            const version = node.devDependencies[name];

            this.graph.addNode(
              name,
              new PackageNode({ name, version }, null, false),
            );
          }
        }
      }
    });

    nodes.forEach(node => {
      if (node.dependencies) {
        for (const name in node.dependencies) {
          if (node.dependencies.hasOwnProperty(name)) {
            this.graph.addDependency(node.name, name);
          }
        }
      }

      if (node.devDependencies) {
        for (const name in node.devDependencies) {
          if (node.devDependencies.hasOwnProperty(name)) {
            this.graph.addDependency(node.name, name);
          }
        }
      }
    });
  }
}
