import { resolve } from 'path';
import * as execa from 'execa';
import { whichManager } from './manager';
import { getCWD } from '../consts';

interface YarnInfo {
  [name: string]: {
    location: string;
  };
}

export async function scan(): Promise<string[]> {
  const cwd = getCWD();
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
    const info: YarnInfo = JSON.parse(
      stdout.replace(/\}[^D}\}]+Done in(.*)+/gm, ''),
    );

    Object.keys(info).forEach(key => {
      locations.push(resolve(cwd, info[key].location));
    });

    return locations;
  }

  return locations;
}
