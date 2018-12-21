import { createRegistry, createPackageMap } from '../registry';
import { scan } from '../scanner';
import { updatePackages } from '../file';

export async function addDependency({
  name,
  parent,
  version,
  type,
}: {
  name: string;
  version: string;
  parent: string;
  type: 'direct' | 'dev';
}): Promise<void> {
  const updater = updatePackages();
  const locations = await scan();
  const registry = await createRegistry(locations);
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
