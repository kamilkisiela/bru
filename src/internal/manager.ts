import { join } from 'path';
import setup from './setup';

export async function whichManager(): Promise<'yarn' | 'lerna'> {
  const pkg = JSON.parse(
    await setup.fs.readFile(join(setup.cwd, 'package.json')),
  );

  if (pkg.workspaces) {
    return 'yarn';
  }

  return 'lerna';
}
