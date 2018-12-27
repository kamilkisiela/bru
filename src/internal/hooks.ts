import { join, resolve } from 'path';

import setup from './setup';

interface HookEvent {
  type: string;
  data?: any;
}

export async function runHook(
  hook: HookEvent,
  locations: string[],
): Promise<void> {
  await Promise.all(
    locations.map(async location => {
      const pkg = JSON.parse(
        await setup.fs.readFile(join(location, 'package.json')),
      );

      const runner = pkg.config && pkg.config.bru && pkg.config.bru.hook;

      if (runner) {
        const fn = await require(resolve(location, runner));

        if (typeof fn !== 'function') {
          throw new Error('Hook file should export a function');
        }

        await fn(hook);
      }
    }),
  );
}
