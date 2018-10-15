import { join } from 'path';
import { DepGraph } from 'dependency-graph';
import { YarnWorkspace, LernaWorkspace, WorkspaceClient } from './workspace';
import { Parser } from './parser';
import { PackageNode } from './packages';

function getWorkspace() {
  return 'yarn';
}

export class Manager {
  private workspace: WorkspaceClient;
  private parser = new Parser();
  private graph = new DepGraph<PackageNode>({
    circular: false,
  });

  constructor() {
    switch (getWorkspace()) {
      case 'yarn':
        this.workspace = new YarnWorkspace();
        break;
      case 'lerna':
        this.workspace = new LernaWorkspace();
        break;
      default:
        throw new Error('Not supported workspace, use either Yarn or Lerna');
    }
  }

  async setVersion(name: string, version: string): Promise<void> {
    const dependants = await this.dependantsOf(name);

    await Promise.all(dependants.map(async dependant => {
      const node = await this.getPackage(dependant);

      await node.updatePackage(name, version);
    }));
  }

  async info() {
    return this.workspace.info();
  }

  async getGraph() {
    if (!this.graph.size()) {
      this.createGraph(await this.getNodes());
    }

    return this.graph;
  }

  async dependantsOf(name: string) {
    const graph = await this.getGraph();

    return graph.dependantsOf(name);
  }

  async getPackage(name: string) {
    const graph = await this.getGraph();

    return graph.getNodeData(name);
  }

  async getAll() {
    const graph = await this.getGraph();

    return graph.overallOrder();
  }

  async getNodes(): Promise<PackageNode[]> {
    // TODO: add root
    const nodes: PackageNode[] = [];
    const packagesMap = await this.workspace.info();

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

  createGraph(nodes: PackageNode[]) {
    nodes.forEach(node => {
      this.graph.addNode(node.name, node);

      if (node.dependencies) {
        for (const name in node.dependencies) {
          if (node.dependencies.hasOwnProperty(name)) {
            if (nodes.some(n => n.name === name)) {
              return;
            }
            const version = node.dependencies[name];

            this.graph.addNode(name, new PackageNode({ name, version }, null, false));
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

            this.graph.addNode(name, new PackageNode({ name, version }, null, false));
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

      if (node.peerDependencies) {
        for (const name in node.peerDependencies) {
          if (node.peerDependencies.hasOwnProperty(name)) {
            this.graph.addDependency(node.name, name);
          }
        }
      }
    });
  }
}
