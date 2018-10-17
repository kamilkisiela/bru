#!/usr/bin/env node

import * as program from 'commander';
import * as semver from 'semver';
import chalk from 'chalk';

const log = console.log;

import { Manager, ChangeInfo } from './manager';

// const root = process.cwd();

// const helpers = {
//   readPackageJson,
//   writePackageJson,
//   getVersionOfPackage,
//   bumpPackage,
//   compare,
// };

program.version('1.0.0');

program
  .command('update <name> <version>')
  .description('Sets a new version of a package')
  .action(async (name, versionOrTag) => {
    log(chalk.blue('Updating', chalk.bold(name)));

    try {
      const manager = new Manager();
      const version = semver.valid(versionOrTag)
        ? versionOrTag
        : await manager.fetchVersion(name, versionOrTag);
      const updated = await manager.setVersion(name, version);

      listUpdated(updated);

      log(chalk.green('Updated', chalk.bold(name), 'to', chalk.bold(version)));
    } catch (e) {
      handleError(e, ['Failed to update', chalk.bold(name)]);
    }
  });

program
  .command('bump <name> <type>')
  .description('Bumps a version of a package')
  .option('-i, --preid <preid>', 'type of prerelease - x.x.x-[PREID].x')
  .action(
    async (name: string, type: semver.ReleaseType, cmd: program.Command) => {
      log(chalk.blue('Bumping', chalk.bold(name), 'by', chalk.bold(type)));

      try {
        const manager = new Manager();

        const version = semver.inc(
          await manager.getVersion(name),
          type,
          cmd.preid || 'beta',
        );

        if (!version) {
          throw new Error(`Failed to bump version of ${name}`);
        }

        const updated = await manager.setVersion(name, version);

        listUpdated(updated);

        log(chalk.green('Bumped', chalk.bold(name), 'to', chalk.bold(version)));
      } catch (e) {
        handleError(e, ['Failed to bump', chalk.bold(name)]);
      }
    },
  );

program
  .command('release <name>')
  .description('Releases a new version of a package')
  .action((name: string) => {
    try {
      throw new Error('Not yet implemented');
      // log(chalk.blue('Releasing', chalk.bold(name)));

      // const version = getVersionOfPackage(name);
      // const prerelease = semver.prerelease(version);

      // // runHooks('release', name, version);

      // const withTag = prerelease ? `-- --tag next` : ``;

      // shelljs.exec(`(cd packages/${name} && npm run deploy ${withTag})`);

      // log(
      //   chalk.green(
      //     'Released version',
      //     chalk.bold(version),
      //     'of',
      //     chalk.bold(name),
      //   ),
      // );
    } catch (e) {
      handleError(e, ['Failed to release', chalk.bold(name)]);
    }
  });

program.parse(process.argv);

function listUpdated(updated: ChangeInfo[]) {
  if (updated.length) {
    updated.forEach(change =>
      log(
        chalk.bold(change.source),
        ':',
        change.from,
        ' => ',
        chalk.bold(change.to),
      ),
    );
  } else {
    log('No changes');
  }
}

// // Runs hooks on every package
// function runHooks(type: string, name: string, version: string) {
//   const container = 'wieldo';
//   const packages: string[] = fs
//     .readdirSync(path.resolve(root, 'packages'))
//     .filter(dir =>
//       fs.lstatSync(path.resolve(root, 'packages', dir)).isDirectory(),
//     );

//   packages.forEach(packageName => {
//     const pkg = JSON.parse(readPackageJson(packageName));

//     if (!pkg[container]) {
//       return;
//     }

//     const hooks = pkg[container];

//     if (hooks[type]) {
//       const fn = eval(
//         fs.readFileSync(
//           path.resolve(root, 'packages', packageName, hooks[type]),
//           { encoding: 'utf-8' },
//         ),
//       );
//       fn(name, version, helpers);
//     }
//   });
// }

function handleError(error: Error, msg: any[]) {
  log('');
  log(chalk.red(...msg), ':', chalk.red(chalk.italic(error.message)));

  process.exit(1);
}
