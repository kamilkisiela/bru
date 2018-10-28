# bru

Manages relations between packages in monorepo.

## API

### `bru add <name> [versionOrTag]`

- `-D`, `--save-dev` _Adds as dev dependency_
- `-R`, `--root` _Saves in the root_
- `-P <name>`, `--package <name>` _Saves in a package_

Adds a new package to root or a specific local package

### `bru version <name> <version or tag>`

Sets a new version of a package (specific or based on provided dist tag)

### `bru latest`

Updates all packages to latest (by default, you can pick another dist-tag)

### `bru bump <name> <type>`

Bumps a version of a package

- `-i <preid>`, `--preid <preid>` _type of prerelease - x.x.x-[PREID].x_

### `bru integrity [name]`

Checks if all versions are the same of all or specific package

## Hooks

Available hooks: `version`

```json
{
  "config": {
    "bru": {
      "version": "./on-version.js"
    }
  }
}
```

```js
module.exports = function(event) {
  // event.type
  // event.data
};
```
