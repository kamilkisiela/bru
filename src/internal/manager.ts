import { readFileSync } from 'fs';
import { join } from 'path';
import {getCWD} from '../consts';

export async function whichManager(): Promise<'yarn' | 'lerna'> {
  const pkg = JSON.parse(
    readFileSync(join(getCWD(), 'package.json'), {
      encoding: 'utf-8',
    }),
  );

  if (pkg.workspaces) {
    return 'yarn';
  }

  return 'lerna';
}
