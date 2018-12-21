import { connect, createPackageMap, Registry } from '../registry';
import { updatePackages } from '../file';
import { getVersionOf } from './get-version';
import * as semver from 'semver';

export async function bumpVersionOf({
  name,
  type,
  registry,
}: {
  name: string;
  type: semver.ReleaseType;
  registry: Registry;
}) {
  const currentVersion = await getVersionOf({ name, registry });

  if (typeof currentVersion !== 'string') {
    throw new Error(`Module ${name} has multiple version`);
  }

  const version = semver.inc(currentVersion, type);

  if (!version) {
    throw new Error(`Failed to bump ${module} by ${type}`);
  }

  return setVersionOf({
    name,
    version,
    registry,
  });
}

export async function setVersionOf({
  name,
  version,
  registry,
}: {
  name: string;
  version: string;
  registry: Registry;
}): Promise<void> {
  const updater = updatePackages();
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
        type: 'UPDATE',
      });
    }
  }

  await updater.commit();
}
