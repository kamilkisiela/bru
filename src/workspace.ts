import * as execa from 'execa';
import { relative } from 'path';

type Info = {
  [name: string]: {
    location: string;
  };
};

interface AddInfo {
  space: string | 'root';
  name: string;
  versionOrTag?: string;
  type: 'dev' | 'direct';
}

export interface WorkspaceClient {
  info(): Promise<Info>;
  add(info: AddInfo): Promise<void>;
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

  async add(info: AddInfo) {
    if (info.space === 'root') {
      this.addInRoot(info);
    } else {
      this.addInWorkspace(info);
    }
  }

  private async addInWorkspace(info: AddInfo) {
    const cmd = [
      'workspace',
      info.space,
      'add',
      ...this.translateAdd(info.type, info.name, info.versionOrTag),
    ];
    
    await execa('yarn', cmd);
  }

  private async addInRoot(info: AddInfo) {
    const cmd = [
      'add',
      ...this.translateAdd(info.type, info.name, info.versionOrTag),
      '-W',
    ];

    await execa('yarn', cmd);
  }

  private translateAdd(
    type: string,
    name: string,
    versionOrTag?: string,
  ): string[] {
    const pkg = versionOrTag ? `${name}@${versionOrTag}` : name;

    if (type === 'dev') {
      return ['-D', pkg];
    }

    return [pkg];
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

  async add() {
    throw new Error('Not yet implemented');
  }
}
