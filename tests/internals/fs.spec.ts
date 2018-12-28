import {detectIndent} from '../../src/internal/fs';

test('Detect Indent', async () => {
  expect(detectIndent(`  a`).length).toEqual(2);
});
