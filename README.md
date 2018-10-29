# bru

Bru 🤵 helps you manage monorepos.

Try it out, it's lekker bru!

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?maxAge=2592000)](https://raw.githubusercontent.com/kamilkisiela/bru/master/LICENSE)
[![npm](https://img.shields.io/npm/v/bru.svg)](https://www.npmjs.com/package/bru)

* [Usage](#usage)
* [Commands](#commands)
* [Hooks](#hooks)

# Usage

```sh-session
$ npm install -g bru

$ bru COMMAND
running command...

$ bru (-v|--version|version)
bru/1.0.0

$ bru --help [COMMAND]
USAGE
  $ bru COMMAND

...
```

# Commands

* [`bru add <package> [versionOrTag]`](#bru-add-package-versionortag)
* [`bru bump <package> <TYPE>`](#bru-bump-package-type)
* [`bru set <package> <versionOrTag>`](#bru-set-package-versionortag)
* [`bru get [package]`](#bru-get-package)
* [`bru check`](#bru-check)


## `bru add <package> [versionOrTag]`

Adds a new package to the root (by default) or a specific local package

```
USAGE
  $  bru add <package> [versionOrTag]

OPTIONS
  -f, --force
  -h, --help            show CLI help
  -D, --save-dev        as dev dependency
  -R, --root            saves in root dir (default)
  -P, --package <name>  saves in a package
```

## `bru set <package> <versionOrTag>`

Sets a new version of a package (specific or based on provided dist tag)

```
USAGE
  $  bru set <package> <versionOrTag>

OPTIONS
  -f, --force
  -h, --help            show CLI help
```

### `bru get <package>`

Displays a version of a package

```
USAGE
  $  bru get <package>

OPTIONS
  -h, --help            show CLI help
```

## `bru bump <package> <type>`

Bumps a version of a package.

Available types: 

- major
- premajor
- minor
- preminor
- patch
- prepatch
- prerelease

```
USAGE
  $  bru bump <package> <type>

OPTIONS
  -f, --force
  -h, --help            show CLI help
  -i, --preid <preid>   type of prerelease - x.x.x-[PREID].x
```

## `bru check [package]`

Checks if every package (or specific one) is in the same version across entire project.

```
USAGE
  $  bru check [package]

OPTIONS
  -f, --force
  -h, --help            show CLI help
```

# Hooks

Bru allows to hook into changes in monorepo.

```json
{
  "config": {
    "bru": {
      "listen": "./bru-events.js"
    }
  }
}
```

```js
/**
 * event: {
 *   type: string;
 *   data: any
 * }
 */
module.exports = function(event) {
  switch(event.type) {
    case 'version':
      console.log('Version changed', event.data);
  }
};
```
