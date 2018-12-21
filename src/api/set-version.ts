import { connect, createRegistry, createPackageMap } from '../registry';
import { scan } from '../scanner';
import { updatePackages } from '../file';
import { getVersionOf } from './get-version';
import * as semver from 'semver';

export async function bumpVersionOf(name: string, type: semver.ReleaseType) {
  const currentVersion = await getVersionOf(name);

  if (typeof currentVersion !== 'string') {
    throw new Error(`Module ${name} has multiple version`);
  }

  const version = semver.inc(currentVersion, type);

  if (!version) {
    throw new Error(`Failed to bump ${module} by ${type}`);
  }

  return setVersionOf(name, version);
}

export async function setVersionOf(
  name: string,
  version: string,
): Promise<void> {
  const updater = updatePackages();
  const locations = await scan();
  const registry = await createRegistry(locations);
  const packageMap = createPackageMap(registry);
  const graph = connect(registry);
  const dep = graph.getNodeData(name);

  if (!dep) {
    throw new Error(`Module ${name} is not available in your project`);
  }

  for (const parentName in dep) {
    if (dep.hasOwnProperty(parentName)) {
      updater.change({
        name,
        location: packageMap[parentName].location,
        version,
        type: 'SET',
      });
    }
  }

  await updater.commit();
}
