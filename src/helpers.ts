import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';

const root = process.cwd();

// Get the current version of a {name} package
export function getVersionOfPackage(name: string) {
  return JSON.parse(readPackageJson(name)).version;
}

// Reads {name} package.json (as string)
export function readPackageJson(name: string) {
  return fs.readFileSync(path.resolve(root, 'packages', name, 'package.json'), {
    encoding: 'utf-8',
  });
}

// Writes new package.json
export function writePackageJson(name: string, data: string) {
  fs.writeFileSync(path.resolve(root, 'packages', name, 'package.json'), data, {
    encoding: 'utf-8',
  });
}

// Bump dependency of {name} in {source} package.json
export function bumpPackage(source: string, name: string, version: string) {
  // "apollo-angular": "~1.4.0"
  const findPackage = new RegExp(`"${name}": "\\~[^"]+"`);
  const pkg = readPackageJson(source);

  writePackageJson(
    source,
    pkg.replace(findPackage, `"${name}": "~${version}"`),
  );

  if (
    JSON.parse(readPackageJson(source)).dependencies[name] !== `~${version}`
  ) {
    throw new Error(`Bumping ${name} failed in ${source}`);
  }
}

// Compares dependency of {name} in {source} package.json
export function compare(source: string, name: string) {
  const inSource = JSON.parse(readPackageJson(source)).dependencies[name];
  const inPackage = JSON.parse(readPackageJson(name)).version;

  if (!semver.satisfies(inPackage, inSource)) {
    throw new Error(
      `Version ${inPackage} of ${name} does not satisfy the range ${inSource} in ${source}`,
    );
  }
}
