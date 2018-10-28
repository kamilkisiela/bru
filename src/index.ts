#!/usr/bin/env node

import * as program from 'commander';
import * as semver from 'semver';
import chalk from 'chalk';

const log = console.log;

import { Manager, ChangeInfo } from './manager';

program.version('1.0.0');

program
  .command('integrity [name]')
  .description('Checks integrity')
  .action(async name => {
    log(
      chalk.blue(
        'Checking integrity',
        name ? `of ${chalk.bold(name)} package` : '',
      ),
    );

    try {
      const manager = new Manager();
      if (name) {
        await manager.checkIntegrityOf(name);
      } else {
        await manager.checkIntegrity();
      }

      log(chalk.green.bold('All good'));
    } catch (e) {
      handleError(e, ['Checking integrity']);
    }
  });

program
  .command('add <name> [versionOrTag]')
  .description('Adds a new package')
  .option('-D, --save-dev', 'Adds as dev dependency')
  .option('-R, --root', 'Saves in the root')
  .option('-P, --package <name>', 'Saves in a package')
  .action(
    async (
      name: string,
      versionOrTag: string | undefined,
      cmd: program.Command,
    ) => {
      log(chalk.blue('Adding', chalk.bold(name)));

      try {
        const manager = new Manager();

        await manager.add({
          name,
          versionOrTag,
          type: cmd['save-dev'] ? 'dev' : 'direct',
          space: cmd.root ? 'root' : cmd.package,
        });

        log(chalk.green('Added', chalk.bold(name)));
      } catch (e) {
        handleError(e, ['Failed to add', chalk.bold(name)]);
      }
    },
  );

program
  .command('version <name> [version]')
  .alias('v')
  .description('Sets or gets a version of a package')
  .option('-f, --force', 'Force setting a new version, skips integrity check')
  .action(async (name: string, versionOrTag: string, cmd: program.Command) => {
    if (typeof versionOrTag === 'string') {
      log(chalk.blue('Updating', chalk.bold(name), `(trying ${versionOrTag})`));

      try {
        const manager = new Manager();
        const version = versionOrTag.includes('.')
          ? versionOrTag
          : await manager.fetchVersion(name, versionOrTag);

        if (!semver.valid(version)) {
          throw new Error(`Invalid version: ${version}`);
        }

        const updates = await manager.setVersion(
          name,
          version,
          cmd.force === true,
        );

        printUpdates(updates);

        log(
          chalk.green('Updated', chalk.bold(name), 'to', chalk.bold(version)),
        );
      } catch (e) {
        handleError(e, ['Failed to update', chalk.bold(name)]);
      }
    } else {
      try {
        const manager = new Manager();
        const version = await manager.getVersion(name);

        log(chalk.green(chalk.bold(name), 'is', chalk.bold(version)));
      } catch (e) {
        handleError(e, ['Failed to check version', chalk.bold(name)]);
      }
    }
  });

program
  .command('latest')
  .alias('av')
  .description('Sets a latest version for every package')
  .option('-f, --force', 'Force setting a new version, skips integrity check')
  .action(async (cmd: program.Command) => {
    log(
      chalk.blue('Updating', chalk.bold('all packages')),
    );

    const manager = new Manager();
    const list = await manager.list();

    await Promise.all(
      list.map(async node => {
        if (node.isLocal()) {
          return;
        }

        try {
          const version = await manager.fetchVersion(node.name, 'latest');

          await manager.setVersion(node.name, version, cmd.force === true);

          log(
            chalk.green(
              'Updated',
              chalk.bold(node.name),
              'to',
              chalk.bold(version),
            ),
          );
        } catch (e) {
          handleError(e, ['Failed to update', chalk.bold(node.name)]);
        }
      }),
    );
  });

program
  .command('bump <name> <type>')
  .alias('b')
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

        const updates = await manager.setVersion(name, version);

        printUpdates(updates);

        log(chalk.green('Bumped', chalk.bold(name), 'to', chalk.bold(version)));
      } catch (e) {
        handleError(e, ['Failed to bump', chalk.bold(name)]);
      }
    },
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

function printUpdates(updates: ChangeInfo[]) {
  if (updates.length) {
    updates.forEach(change =>
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

function handleError(error: Error, msg: any[]) {
  log('');
  log(chalk.red(...msg), ':', chalk.red.italic(error.message));

  process.exit(1);
}
