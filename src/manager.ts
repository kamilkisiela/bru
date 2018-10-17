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

  public async checkIntegrity() {
    const graph = await this.getGraph();
    const errors: Error[] = [];

    await Promise.all(
      graph.overallOrder().map(async name => {
        try {
          await this.checkIntegrityOf(name);
        } catch (e) {
          errors.push(e.message);
        }
      }),
    );

    if (errors.length) {
      throw new Error(
        ['Integrity check failed!', errors.join('\n')].join('\n'),
      );
    }
  }

  public async checkIntegrityOf(name: string) {
    const dependants = await this.dependantsOf(name);

    const list = await Promise.all(
      dependants.map(async dependant => {
        const node = await this.getPackage(dependant);
        return {
          name: dependant,
          version: await node.versionOfDependency(name),
        };
      }),
    );

    const sameVersions = list.every(
      (node, _, all) => node.version === all[0].version,
    );

    if (!sameVersions) {
      throw new Error(
        [
          `Package ${name} has multiple versions:`,
          list.map(({ name, version }) => `${name}: ${version}`).join('\n'),
        ].join('\n'),
      );
    }
  }

  public async setVersion(
    name: string,
    version: string,
    force = false,
  ): Promise<ChangeInfo[]> {
    const dependants = await this.dependantsOf(name);
    const requested = await this.getPackage(name);
    const updated: ChangeInfo[] = [];

    try {
      await this.checkIntegrityOf(name);
    } catch (e) {
      if (!force) {
        throw e;
      }

      console.log(e);
    }

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

  public async getVersion(name: string): Promise<string> {
    const requested = await this.getPackage(name);

    return requested.version;
  }

  public async fetchVersion(name: string, tag: string): Promise<string> {
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

    try {
      return graph.getNodeData(name);
    } catch (e) {
      throw new Error(`Couldn't find package ${name}`);
    }
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
    const depsPerNode = nodes.map(node => {
      this.graph.addNode(node.name, node);

      const deps = node.listOfDependencies();

      deps.filter(dep => !nodes.some(n => n.name === dep.name)).forEach(dep => {
        this.graph.addNode(dep.name, new PackageNode(dep, null, false));
      });

      return deps;
    });

    depsPerNode.forEach((deps, i) => {
      const name = nodes[i].name;

      deps.forEach(dep => {
        this.graph.addDependency(name, dep.name);
      });
    });
  }
}
