import { readFile, writeFile } from 'fs';
import immer from 'immer';
import { PackageJSON } from './packages';

export class Parser {
  async parse(location: string): Promise<PackageJSON> {
    const json = await this.readJSON(location);

    return {
      name: json.name,
      version: json.version,
      private: !!json.private,
      peerDependencies: json.peerDependencies,
      dependencies: json.dependencies,
      devDependencies: json.devDependencies,
    };
  }

  async readJSON(filepath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      readFile(
        filepath,
        {
          encoding: 'utf-8',
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        },
      );
    });
  }

  async updateJSON(filepath: string, updateFn: (json: any) => any) {
    const content = await this.readJSON(filepath);
    const updated = immer(content, updateFn);
    
    await this.writeJSON(filepath, updated);

    return updated;
  }

  async writeJSON(filepath: string, json: any): Promise<void> {
    await new Promise((resolve, reject) => {
      const content = JSON.stringify(json, null, 4);

      writeFile(filepath, content, {
        encoding: 'utf-8'
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }
}
