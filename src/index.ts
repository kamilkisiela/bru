#!/usr/bin/env node

import * as program from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import * as shelljs from 'shelljs';
import chalk from 'chalk';

const log = console.log;

import {
  readPackageJson,
  writePackageJson,
  getVersionOfPackage,
  bumpPackage,
  compare,
} from './helpers';

const root = process.cwd();

const helpers = {
  readPackageJson,
  writePackageJson,
  getVersionOfPackage,
  bumpPackage,
  compare,
};

program.version('1.0.0');

program
  .command('version <name> <version>')
  .description('Sets a new version of a package')
  .action((name, version) => {
    log(chalk.blue('Updating', chalk.bold(name)));

    try {
      setVersion(name, version);
      
      log('');
      log(
        chalk.green(
          'Updated',
          chalk.bold(name),
          'to',
          chalk.bold(version),
        ),
      );
    } catch (e) {
      handleError(e, ['Failed to update', chalk.bold(name)]);
    }
  });

program
  .command('bump <name> <type>')
  .description('Bumps a version of a package')
  .option('-i, --preid <preid>', 'type of prerelease - x.x.x-[PREID].x')
  .action((name: string, type: semver.ReleaseType, cmd: program.Command) => {
    log(
      chalk.blue('Bumping', chalk.bold(name), 'by', chalk.bold(type)),
    );

    try {
      const version = semver.inc(
        getVersionOfPackage(name),
        type,
        cmd.preid || 'beta',
      );

      if (!version) {
        throw new Error(`Failed to bump version of ${name}`);
      }

      setVersion(name, version);

      log('');
      log(
        chalk.green(
          'Bumped',
          chalk.bold(name),
          'to',
          chalk.bold(version),
        ),
      );
    } catch (e) {
      handleError(e, ['Failed to bump', chalk.bold(name)]);
    }
  });

program
  .command('release <name>')
  .description('Releases a new version of a package')
  .action((name: string) => {
    try {
      log(chalk.blue('Releasing', chalk.bold(name)));

      const version = getVersionOfPackage(name);
      const prerelease = semver.prerelease(version);

      runHooks('release', name, version);

      const withTag = prerelease ? `-- --tag next` : ``;

      shelljs.exec(`(cd packages/${name} && npm run deploy ${withTag})`);

      log('');
      log(
        chalk.green(
          'Released version',
          chalk.bold(version),
          'of',
          chalk.bold(name),
        ),
      );
    } catch (e) {
      handleError(e, ['Failed to release', chalk.bold(name)]);
    }
  });

program.parse(process.argv);

// Changes a version of a package
function setVersion(name: string, version: string) {
  log('');
  log('Current version:', chalk.bold(getVersionOfPackage(name)));
  log('Requested version:', chalk.bold(version));

  if (!semver.valid(version)) {
    throw new Error('Invalid version');
  }

  if (!semver.gt(version, getVersionOfPackage(name))) {
    throw new Error('Version should be greater than the current one');
  }

  const pkg = readPackageJson(name);
  const findVersion = /"version"\:\s*"[^"]+"/;

  if (!findVersion.test(pkg)) {
    throw new Error('Request package.json does not have "version" field');
  }

  runHooks('version', name, version);

  writePackageJson(name, pkg.replace(findVersion, `"version": "${version}"`));
}

// Runs hooks on every package
function runHooks(type: string, name: string, version: string) {
  const packages: string[] = fs
    .readdirSync(path.resolve(root, 'packages'))
    .filter(dir =>
      fs.lstatSync(path.resolve(root, 'packages', dir)).isDirectory(),
    );

  packages.forEach(packageName => {
    const pkg = JSON.parse(readPackageJson(packageName));

    if (!pkg['package-hooks']) {
      return;
    }

    const hooks = pkg['package-hooks'];

    if (hooks[type]) {
      const fn = eval(
        fs.readFileSync(
          path.resolve(root, 'packages', packageName, hooks[type]),
          { encoding: 'utf-8' },
        ),
      );
      fn(name, version, helpers);
    }
  });
}

function handleError(error: Error, msg: any[]) {
  log('');
  log(chalk.red(...msg), ':', chalk.red(chalk.italic(error.message)));

  process.exit(1);
}
