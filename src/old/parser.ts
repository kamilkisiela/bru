import { readFile, writeFile } from 'fs';
import immer from 'immer';
const detectIndent = require('detect-indent');
import { PackageJSON } from './packages';

export class Parser {
  async parse(location: string): Promise<PackageJSON> {
    const json = JSON.parse(await this.readJSON(location));

    return {
      ...json,
      private: !!json.private,
    };
  }

  async readJSON(filepath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      readFile(
        filepath,
        {
          encoding: 'utf-8',
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  }

  async updateJSON(filepath: string, updateFn: (json: any) => any) {
    const content = await this.readJSON(filepath);
    const { amount } = detectIndent(content);
    const json = JSON.parse(content);
    const updated = immer(json, updateFn);

    await this.writeJSON(filepath, updated, amount);

    return updated;
  }

  async writeJSON(filepath: string, json: any, ident = 2): Promise<void> {
    await new Promise((resolve, reject) => {
      const content = JSON.stringify(json, null, ident);

      writeFile(
        filepath,
        content,
        {
          encoding: 'utf-8',
        },
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
