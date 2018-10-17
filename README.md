# wieldo

Manages relations between packages in monorepo.

## API

### `wieldo update <name> <version or tag>`

Sets a new version of a package (specific or based on provided dist tag)

### `wieldo bump <name> <type>`

Bumps a version of a package

- `-i <preid>`, `--preid <preid>` _type of prerelease - x.x.x-[PREID].x_

### `wieldo integrity [name]`

Checks if all versions are the same of all or specific package

## Hooks

Available hooks: `version`

```json
{
  "config": {
    "wieldo": {
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
