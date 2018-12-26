#!/usr/bin/env node

import * as program from 'commander';
import * as semver from 'semver';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import api, { Results } from './api';
import { defaultRenderer, Renderer } from './renderer';

const pkg: any = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), {
    encoding: 'utf-8',
  }),
);

program.version(pkg.version);

program
  .command('check [name]')
  .alias('c')
  .description('Checks integrity')
  .action((name: string) =>
    handleAction(() => api.check(name), {
      renderer: defaultRenderer,
    }),
  );

program
  .command('add <name> [versionOrTag]')
  .description('Adds a new package')
  .option('-D, --save-dev', 'Adds as dev dependency')
  .option('-R, --root', 'Saves in the root')
  .option('-P, --package <name>', 'Saves in a package')
  .action((name: string, version: string | undefined, cmd: program.Command) =>
    handleAction(
      () =>
        api.add({
          name,
          version,
          type: cmd.saveDev ? 'dev' : 'direct',
          parent: cmd.root ? null : cmd.package,
        }),
      {
        renderer: defaultRenderer,
      },
    ),
  );

program
  .command('set <name> <version>')
  .alias('s')
  .description('Sets a version of a package')
  // .option('-f, --force', 'Force setting a new version, skips integrity check')
  .action((name: string, version: string) =>
    handleAction(() => api.set(name, version), {
      renderer: defaultRenderer,
    }),
  );

program
  .command('get <name>')
  .alias('g')
  .description('Gets a version of a package')
  .action((name: string) =>
    handleAction(() => api.get(name), {
      renderer: defaultRenderer,
    }),
  );

program
  .command('bump <name> <type>')
  .alias('b')
  .description('Bumps a version of a package')
  // .option('-i, --preid <preid>', 'type of prerelease - x.x.x-[PREID].x')
  .action((name: string, type: semver.ReleaseType) =>
    handleAction(() => api.bump(name, type), {
      renderer: defaultRenderer,
    }),
  );

program.parse(process.argv);

const subCmd: string | undefined = process.argv[2];
const cmds = (program.commands as any[]).map(c => [c._name, c._alias]);

if (cmds.every(o => o.indexOf(subCmd) === -1)) {
  program.help(
    info =>
      `\nCommand "${process.argv.slice(2).join(' ') ||
        ''}" not found\n\n${info}`,
  );
}

async function handleAction(
  fn: () => Promise<Results>,
  {
    renderer,
  }: {
    renderer: Renderer;
  },
) {
  try {
    renderer.success(await fn());
    process.exit(0);
  } catch (e) {
    renderer.error(e);
    process.exit(1);
  }
}
