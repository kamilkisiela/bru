# wieldo

Manages relations between packages in monorepo.

## API

### `wieldo version <name> <version>`

Sets a new version of a package

### `wieldo bump <name> <type>`

Bumps a version of a package

- `-i <preid>`, `--preid <preid>` _type of prerelease - x.x.x-[PREID].x_

### `wieldo release <name>`

Releases a new version of a package

## Hooks

Available hooks: `version` and `release`

```json
{
  "wieldo": {
    "version": "./on-version.js",
    "release": "./on-release.js"
  }
}
```

```js
module.exports = function(name, version, helpers) {
  // logic
}
```

## Helpers

**`readPackageJson(name: string): string`**

Reads package.json of a package.

**`writePackageJson(name: string): string`**

Writes package.json.

**`getVersionOfPackage(name: string): string`**

Reads version of a package (based on package.json).

**`bumpPackage(source: string, name: string, version: string): void`**

Changes version of a package (name) in (source) package.json.

**`compare(source: string, name: string): void`**

Checks if version of a package (name) satisfies a range in (source) package.json, if not it throws an error.
