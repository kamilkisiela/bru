import { resolve } from 'path';
import * as JSON5 from 'json5';
import * as semver from 'semver';
import execa = require('execa');
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
  config?: {
    wieldo?: {
      hooks?: {
        [hook: string]: string;
      };
    };
  };
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

  constructor(
    json: PackageJSON,
    location: string | null,
    isLocal: boolean = false,
  ) {
    this.location = location;
    this.local = isLocal;
    this.init(json);
  }

  public isLocal() {
    return this.local;
  }

  public getLocation() {
    return this.location;
  }

  public async setVersion(version: string) {
    if (!semver.valid(version)) {
      throw new Error(
        `Trying to set an invalid version ${version} for ${this.name} package`,
      );
    }

    const updated = await this.parser.updateJSON(
      resolve(process.cwd(), this.location!),
      pkg => {
        pkg.version = version;
      },
    );

    this.init(updated);
  }

  public async updateDependency(name: string, version: string) {
    if (!semver.valid(version)) {
      throw new Error(
        `Trying to update ${name} to an invalid version: ${version}`,
      );
    }
    // for devDep and dep (should handle peerDep in near future)
    if (this.isLocal) {
      const updated = await this.parser.updateJSON(
        resolve(process.cwd(), this.location!),
        pkg => {
          if (pkg.dependencies && pkg.dependencies[name]) {
            pkg.dependencies[name] = version;
          }

          if (pkg.devDependencies && pkg.devDependencies[name]) {
            pkg.devDependencies[name] = version;
          }
        },
      );

      this.init(updated);
    }
  }

  public async fetchVersion(tag: string = 'latest'): Promise<string> {
    const info = await this.info();

    return info['dist-tags'][tag];
  }

  public async versionOfDependency(name: string): Promise<string> {
    let direct: string | undefined;
    let dev: string | undefined;

    if (this.dependencies && this.dependencies[name]) {
      direct = this.dependencies[name];
    }

    if (this.devDependencies && this.devDependencies[name]) {
      dev = this.devDependencies[name];
    }

    if (direct && dev) {
      throw new Error(
        `${this.name} has both direct and dev dependencies of ${name}`,
      );
    }

    if (!direct && !dev) {
      throw new Error(`${this.name} has no dependency of ${name}`);
    }

    return (direct || dev) as string;
  }

  public listOfDependencies(): {
    name: string;
    version: string;
  }[] {
    const map: {
      [name: string]: string;
    } = {
      ...this.devDependencies,
      ...this.dependencies,
    };
    return Object.keys(map).map(name => ({
      name,
      version: map[name],
    }));
  }

  private init(json: PackageJSON) {
    this.name = json.name;
    this.version = json.version;
    this.dependencies = json.dependencies;
    this.devDependencies = json.devDependencies;
    this.peerDependencies = json.peerDependencies;
    this.private = !!json.private;
  }

  private async info() {
    try {
      const stdout = await execa.stdout('npm', ['info', this.name]);
      return JSON5.parse(stdout.trim());
    } catch (e) {
      throw new Error(`Failed to get info of ${this.name}: ${e}`);
    }
  }
}
