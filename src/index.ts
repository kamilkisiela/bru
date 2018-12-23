#!/usr/bin/env node

import * as program from 'commander';
import * as semver from 'semver';
// import chalk from 'chalk';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// const log = console.log;

// import { hasIntegrity } from './api/integrity';
import api from './api';

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
  .action(async (name: string) => {
    // log(
    //   chalk.blue(
    //     'Checking integrity',
    //     name ? `of ${chalk.bold(name)} package` : '',
    //   ),
    // );

    await api.check(name);

    // if (hasIntegrity(results)) {
    //   log(chalk.green.bold('All good'));
    // } else {
    //   // FIX: it always shows All good...
    //   log(chalk.red('Multiple versions'));
    // }
  });

program
  .command('add <name> [versionOrTag]')
  .description('Adds a new package')
  .option('-D, --save-dev', 'Adds as dev dependency')
  .option('-R, --root', 'Saves in the root')
  .option('-P, --package <name>', 'Saves in a package')
  .action(
    async (name: string, version: string | undefined, cmd: program.Command) => {
      await api.add({
        name,
        version,
        type: cmd['save-dev'] ? 'dev' : 'direct',
        parent: cmd.root ? 'root' : cmd.package,
      });
    },
  );

program
  .command('set <name> <version>')
  .alias('s')
  .description('Sets a version of a package')
  .option('-f, --force', 'Force setting a new version, skips integrity check')
  .action(async (name: string, version: string) => {
    await api.set(name, version);
  });

program
  .command('get <name>')
  .alias('g')
  .description('Gets a version of a package')
  .action(async (name: string) => {
    const result = await api.get(name);

    if (typeof result === 'string') {
      console.log(result);
    } else {
      console.log(`Module ${name} has multiple versions`);
      console.log(result);
    }
  });

program
  .command('bump <name> <type>')
  .alias('b')
  .description('Bumps a version of a package')
  .option('-i, --preid <preid>', 'type of prerelease - x.x.x-[PREID].x')
  .action(async (name: string, type: semver.ReleaseType) => {
    await api.bump(name, type);
  });

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

// function printUpdates(updates: ChangeInfo[]) {
//   if (updates.length) {
//     updates.forEach(change =>
//       log(
//         chalk.bold(change.source),
//         ':',
//         change.from,
//         ' => ',
//         chalk.bold(change.to),
//       ),
//     );
//   } else {
//     log('No changes');
//   }
// }

// function handleError(error: Error, msg: any[]) {
//   log('');
//   log(chalk.red(...msg), ':', chalk.red.italic(error.message));

//   process.exit(1);
// }
