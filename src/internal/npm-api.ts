import fetch from 'node-fetch';

async function readByVersion(
  name: string,
  versionOrTag: string,
): Promise<{
  version: string;
}> {
  const raw = await fetch(`https://registry.npmjs.com/${name}/${versionOrTag}`);

  return raw.json();
}

export async function getVersionByTag(
  name: string,
  tag: string,
): Promise<string> {
  if (tag.indexOf('.') !== -1) {
    throw new Error(`Tag ${tag} is invalid`);
  }

  const pkg = await readByVersion(name, tag);

  return pkg.version;
}
