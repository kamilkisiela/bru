import { resolve } from 'path';
import { Parser } from './parser';

export interface Dependency {
  name: string;
  version: string;
}

export interface PackageJSON {
  name: string;
  version: string;
  dependencies?: {
    [name: string]: string;
  };
  devDependencies?: {
    [name: string]: string;
  };
  peerDependencies?: {
    [name: string]: string;
  };
  private?: boolean;
}

export class PackageNode {
  public name!: string;
  public version!: string;
  public dependencies?: {
    [name: string]: string;
  };
  public devDependencies?: {
    [name: string]: string;
  };
  public peerDependencies?: {
    [name: string]: string;
  };
  public private: boolean = false;
  private location: string | null;
  private local: boolean;
  private parser: Parser = new Parser();

  constructor(json: PackageJSON, location: string | null, isLocal: boolean = false) {
    this.location = location;
    this.local = isLocal;
    this.init(json);
  }

  init(json: PackageJSON) {
    this.name = json.name;
    this.version = json.version;
    this.dependencies = json.dependencies;
    this.devDependencies = json.devDependencies;
    this.peerDependencies = json.peerDependencies;
    this.private = !!json.private;
  }

  getLocation() {
    return this.location;
  }

  isLocal() {
    return this.local;
  }

  async updatePackage(name: string, version: string) {
    // for devDep and dep (should handle peerDep in near future)
    if (this.isLocal) {
      const updated = await this.parser.updateJSON(resolve(process.cwd(), this.location!), pkg => {
        if (pkg.dependencies && pkg.dependencies[name]) {
          pkg.dependencies[name] = version;
        }

        if (pkg.devDependencies && pkg.devDependencies[name]) {
          pkg.devDependencies[name] = version;
        }
      });

      this.init(updated);
    }
  }
}
