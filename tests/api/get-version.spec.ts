import { resolve } from 'path';

import setup from '../../src/internal/setup';
import { getVersionOf } from '../../src/api/get-version';
import { scan } from '../../src/internal/scanner';
import { createRegistry } from '../../src/internal/registry';

describe('Get version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await scan();
      const registry = await createRegistry(locations);

      expect(
        await getVersionOf({
          name: 'graphql',
          registry,
        }),
      ).toEqual('14.0.2');
    });
  });
});
