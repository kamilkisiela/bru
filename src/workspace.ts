import * as execa from 'execa';
import { relative } from 'path';

type Info = {
  [name: string]: {
    location: string;
  };
};

export interface WorkspaceClient {
  info(): Promise<Info>;
}

type YarnInfo = {
  [name: string]: {
    location: string;
  };
};

export class YarnWorkspace implements WorkspaceClient {
  async info() {
    const { stdout } = await execa('yarn', ['workspaces', 'info']);

    const info: YarnInfo = JSON.parse(
      stdout.replace(/\}[^D}\}]+Done in(.*)+/gm, ''),
    );

    return info;
  }
}

export class LernaWorkspace implements WorkspaceClient {
  async info() {
    const { stdout } = await execa('lerna', ['ls', '-pla']);
    const info: Info = {};

    stdout.split('\n').forEach(line => {
      const [location, name] = line.trim().split(':');

      info[name] = { location: relative(process.cwd(), location) };
    });

    return info;
  }
}
