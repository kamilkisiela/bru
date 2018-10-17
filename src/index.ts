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
  .command('update <name> <version>')
  .description('Sets a new version of a package')
  .option('-f, --force', 'Force setting a new version, skips integrity check')
  .action(async (name: string, versionOrTag: string, cmd: program.Command) => {
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

        const updates = await manager.setVersion(name, version);

        printUpdates(updates);

        log(chalk.green('Bumped', chalk.bold(name), 'to', chalk.bold(version)));
      } catch (e) {
        handleError(e, ['Failed to bump', chalk.bold(name)]);
      }
    },
  );

program.parse(process.argv);

const subCmd: string | undefined = program.args[0];
const cmds = (program.commands as any[]).map(c => c._name);

if (cmds.indexOf(subCmd) === -1) {
  program.help((info) => `\nCommand "${subCmd || ''}" not found\n\n${info}`);
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
