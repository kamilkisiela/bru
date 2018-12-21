import { resolve } from 'path';

import { setCWD } from '../../src/consts';
import { getVersionOf } from '../../src/api/get-version';

describe('Get version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setCWD(resolve(__dirname, `../../example/${manager}`));

      expect(await getVersionOf('graphql')).toEqual('14.0.2');
    });
  });
});
