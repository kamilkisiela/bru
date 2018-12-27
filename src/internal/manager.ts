import { resolve, join } from 'path';
import * as execa from 'execa';

import setup from './setup';

export async function whichManager(): Promise<'yarn' | 'lerna'> {
  const pkg = JSON.parse(
    await setup.fs.readFile(join(setup.cwd, 'package.json')),
  );

  if (pkg.workspaces) {
    return 'yarn';
  }

  return 'lerna';
}

export async function findLocations(): Promise<string[]> {
  const cwd = setup.cwd;
  const manager = await whichManager();
  const locations: string[] = [cwd];

  if (manager === 'lerna') {
    const { stdout } = await execa('lerna', ['ls', '-pla'], {
      cwd,
    });

    stdout.split('\n').forEach(line => {
      const [location] = line.trim().split(':');
      locations.push(resolve(cwd, location));
    });

    return locations;
  }

  if (manager === 'yarn') {
    const { stdout } = await execa('yarn', ['workspaces', 'info'], {
      cwd,
    });
    const info: {
      [name: string]: {
        location: string;
      };
    } = JSON.parse(stdout.replace(/\}[^D}\}]+Done in(.*)+/gm, ''));

    Object.keys(info).forEach(key => {
      locations.push(resolve(cwd, info[key].location));
    });

    return locations;
  }

  return locations;
}
