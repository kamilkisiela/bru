import { ReleaseType, inc } from 'semver';
// api
import { getVersionOf, MissingPackageEvent } from './get';
// internal
import { updatePackages } from '../internal/fs';
import { Event } from '../internal/events';
import {
  createGraph,
  createPackageMap,
  Registry,
  isLocal,
  Dependency,
} from '../internal/registry';

export enum SetTypes {
  Multiple = '[Set] Multiple versions',
  IncorrectType = '[Set] Incorrect bump type',
}
export type SetEvents = MultipleVersionEvent | IncorrectBumpTypeEvent;

export async function bumpVersionOf({
  name,
  type,
  registry,
}: {
  name: string;
  type: ReleaseType;
  registry: Registry;
}) {
  const currentVersion = await getVersionOf({ name, registry });

  if (typeof currentVersion !== 'string') {
    // throw new Error(`Module ${name} has multiple version`);
    throw new MultipleVersionEvent({
      name,
      dependencies: currentVersion,
    });
  }

  const version = inc(currentVersion, type);

  if (!version) {
    // throw new Error(`Failed to bump ${name} to ${type}`);
    throw new IncorrectBumpTypeEvent({
      name,
      type,
    });
  }

  await setVersionOf({
    name,
    version,
    registry,
  });

  return version;
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
  const graph = createGraph(registry);

  if (!graph.hasNode(name)) {
    // throw new Error(`Module ${name} is not available in your project`);
    throw new MissingPackageEvent({
      name,
    });
  }

  const dep = graph.getNodeData(name);

  if (isLocal(name, registry)) {
    updater.change({
      name,
      location: packageMap[name].location,
      version,
      type: 'UPDATE',
    });
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

export class MultipleVersionEvent implements Event {
  type = SetTypes.Multiple;

  constructor(
    public payload: {
      name: string;
      dependencies: Dependency;
    },
  ) {}
}

export class IncorrectBumpTypeEvent implements Event {
  type = SetTypes.IncorrectType;

  constructor(
    public payload: {
      name: string;
      type: ReleaseType;
    },
  ) {}
}
