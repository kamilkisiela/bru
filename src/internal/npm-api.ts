import fetch from 'node-fetch';

async function fetchPackageByVersion(
  name: string,
  versionOrTag: string,
): Promise<{
  version: string;
}> {
  const raw = await fetch(`https://registry.npmjs.com/${name}/${versionOrTag}`);

  return raw.json();
}

export async function fetchVersionByTag(
  name: string,
  tag: string,
): Promise<string> {
  if (tag.indexOf('.') !== -1) {
    throw new Error(`Tag ${tag} is invalid`);
  }

  const pkg = await fetchPackageByVersion(name, tag);

  return pkg.version;
}
