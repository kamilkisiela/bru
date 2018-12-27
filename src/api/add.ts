// internal
import { Registry, createPackageMap } from '../internal/registry';
import { updatePackages } from '../internal/fs';
import { Event } from '../internal/events';

export enum AddTypes {
  MissingLocal = '[Add] Missing local package',
}

export type AddEvents = MissingLocalPackageEvent;

export interface AddInput {
  name: string;
  parent: string;
  type: 'direct' | 'dev';
  registry: Registry;
  version: string;
}

export async function addDependency({
  registry,
  version,
  name,
  type,
  parent,
}: AddInput): Promise<void> {
  const updater = updatePackages();
  const packageMap = createPackageMap(registry);

  if (!parent) {
    // throw new Error(`Module ${parent} is not available in your project`);
    throw new MissingLocalPackageEvent({
      name: parent
    });
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

export class MissingLocalPackageEvent implements Event {
  type = AddTypes.MissingLocal;

  constructor(
    public payload: {
      name: string;
    },
  ) {}
}