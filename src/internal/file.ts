import { readFile, writeFile } from 'fs';
import immer from 'immer';
const detectIndent = require('detect-indent');
import { join } from 'path';

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
  const changesMap: {
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
    },
  };

  async function update(location: string) {
    const changes = changesMap[location];
    const pkg = await readPackage(location);
    const { indent } = detectIndent(pkg.raw);

    const updated = immer(pkg.data, data => {
      changes.forEach(change => {
        if (change.type === 'UPDATE') {
          if (data.dependencies) {
            data.dependencies[change.name] = change.version;
          }

          if (data.devDependencies) {
            data.devDependencies[change.name] = change.version;
          }
        }

        if (change.type === 'INSERT') {
          if (change.dependency === 'direct') {
            if (!data.dependencies) {
              data.dependencies = {};
            }
            data.dependencies[change.name] = change.version;
          }

          if (change.dependency === 'dev') {
            if (!data.devDependencies) {
              data.devDependencies = {};
            }
            data.devDependencies[change.name] = change.version;
          }
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
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}> {
  return new Promise<{
    raw: string;
    data: any;
  }>((resolve, reject) => {
    readFile(
      join(location, 'package.json'),
      { encoding: 'utf-8' },
      (err, raw) => {
        if (err) {
          reject(err);
        } else {
          const data = JSON.parse(raw);

          resolve({
            raw,
            data,
          });
        }
      },
    );
  });
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
  return new Promise<void>((resolve, reject) => {
    writeFile(
      join(location, 'package.json'),
      JSON.stringify(data, null, indent),
      { encoding: 'utf-8' },
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
