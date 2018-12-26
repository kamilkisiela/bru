import { readFile, writeFile } from 'fs';
import { join } from 'path';
import immer from 'immer';
import * as detectStringIndent from 'detect-indent';

import setup from './setup';
import { ensureProp, updateProp } from './utils';

export function detectIndent(data: string): string {
  const { indent } = detectStringIndent(data);

  return indent;
}

// File System

export interface FileSystem {
  readFile(filepath: string): Promise<string>;
  writeFile(filepath: string, data: string): Promise<void>;
}

export const fs: FileSystem = {
  async writeFile(filepath, data) {
    return new Promise<any>((resolve, reject) => {
      writeFile(filepath, data, { encoding: 'utf-8' }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  async readFile(filepath) {
    return new Promise<string>((resolve, reject) => {
      readFile(filepath, { encoding: 'utf-8' }, (err, raw) => {
        if (err) {
          reject(err);
        } else {
          resolve(raw);
        }
      });
    });
  },
};

// PackageJSON

export type Change = InsertEvent | UpdateEvent | DeleteEvent;

interface InsertEvent {
  location: string;
  name: string;
  version: string;
  dependency: 'direct' | 'dev';
  type: 'INSERT';
}

interface UpdateEvent {
  location: string;
  name: string;
  version: string;
  type: 'UPDATE';
}

interface DeleteEvent {
  location: string;
  name: string;
  type: 'DELETE';
}

export function updatePackages() {
  let changesMap: {
    [location: string]: Change[];
  } = {};

  return {
    change(event: Change) {
      if (!changesMap[event.location]) {
        changesMap[event.location] = [];
      }

      changesMap[event.location].push(event);
    },
    async commit() {
      await Promise.all(Object.keys(changesMap).map(update));
      changesMap = {};
    },
  };

  async function update(location: string) {
    const changes = changesMap[location];
    const pkg = await readPackage(location);
    const indent = detectIndent(pkg.raw);

    const updated = immer(pkg.data, data => {
      changes.forEach(change => {
        if (change.type === 'UPDATE') {
          if (data.name === change.name) {
            data.version = change.version;
          }
          updateProp(data.dependencies, change.name, change.version);
          updateProp(data.devDependencies, change.name, change.version);
        }

        if (change.type === 'INSERT') {
          ensureProp(
            data,
            change.dependency === 'direct' ? 'dependencies' : 'devDependencies',
            change.name,
            change.version,
          );
        }

        if (change.type === 'DELETE') {
          if (data.dependencies && data.dependencies[change.name]) {
            delete data.dependencies[change.name];
          }

          if (data.devDependencies && data.devDependencies[change.name]) {
            delete data.devDependencies[change.name];
          }
        }
      });
    });

    await writePackage({
      location,
      indent,
      data: updated,
    });
  }
}

export async function readPackage(
  location: string,
): Promise<{
  raw: string;
  data: {
    [key: string]: any;
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}> {
  const raw = await setup.fs.readFile(join(location, 'package.json'));

  return {
    raw,
    data: JSON.parse(raw),
  };
}

export async function writePackage({
  location,
  data,
  indent,
}: {
  location: string;
  data: any;
  indent: string;
}): Promise<void> {
  return setup.fs.writeFile(
    join(location, 'package.json'),
    JSON.stringify(data, null, indent),
  );
}
