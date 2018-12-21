import { Registry, createPackageMap } from '../internal/registry';
import { updatePackages } from '../internal/file';

export async function addDependency({
  name,
  parent,
  version,
  type,
  registry,
}: {
  name: string;
  version: string;
  parent: string;
  type: 'direct' | 'dev';
  registry: Registry;
}): Promise<void> {
  const updater = updatePackages();
  const packageMap = createPackageMap(registry);

  if (!parent) {
    throw new Error(`Module ${parent} is not available in your project`);
  }

  updater.change({
    name,
    location: packageMap[parent].location,
    version,
    dependency: type,
    type: 'INSERT',
  });

  await updater.commit();
}
