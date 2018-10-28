import { resolve } from 'path';
import { Parser } from './parser';

interface HookInfo {
  type: string;
  data?: any;
}

export class Hooks {
  private parser = new Parser();

  async run(info: HookInfo, location: string) {
    const pkg = await this.parser.parse(location);
    const runner =
      pkg.config &&
      pkg.config.bru &&
      pkg.config.bru.hooks &&
      pkg.config.bru.hooks[info.type];

    if (!runner) {
      return;
    }

    const fn = await require(resolve(
      location.replace('/package.json', ''),
      runner,
    ));
    if (typeof fn !== 'function') {
      throw new Error('Hook file should export a function');
    }

    fn(info);
  }
}
