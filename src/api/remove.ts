// internal
import { Registry, createPackageMap } from '../internal/registry';
import { updatePackages } from '../internal/fs';
import { Event } from '../internal/events';

export enum RemoveTypes {
  MissingLocal = '[Delete] Missing local package',
}

export type RemoveEvents = MissingLocalPackageEvent;

export interface RemoveInput {
  name: string;
  parent: string;
  registry: Registry;
}

export async function removeDependency({
  registry,
  name,
  parent,
}: RemoveInput): Promise<void> {
  const updater = updatePackages();
  const packageMap = createPackageMap(registry);

  if (!parent) {
    throw new MissingLocalPackageEvent({
      name: parent,
    });
  }

  updater.change({
    name,
    location: packageMap[parent].location,
    type: 'DELETE',
  });

  await updater.commit();
}

export class MissingLocalPackageEvent implements Event {
  type = RemoveTypes.MissingLocal;

  constructor(
    public payload: {
      name: string;
    },
  ) {}
}
