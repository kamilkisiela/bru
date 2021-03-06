import {ReleaseType} from 'semver';
// api
import {addDependency, AddEvents} from './add';
import {
  checkIntegrity,
  IntegrityEvents,
  IntegrityResult,
  hasIntegrity,
  NoIntegrityEvent,
} from './check';
import {setVersionOf, bumpVersionOf, SetEvents} from './set';
import {getVersionOf, GetEvents} from './get';
import {removeDependency, RemoveEvents} from './remove';
// internal
import {isTag} from '../internal/utils';
import {fetchVersionByTag} from '../internal/npm-api';
import {TagOnLocalPackageEvent, CommonEvents} from '../internal/events';
import {findLocations} from '../internal/manager';
import {Event} from '../internal/events';
import {runHook} from '../internal/hooks';
import {
  createRegistry,
  ensureVersionOf,
  isLocal,
  Dependency,
} from '../internal/registry';
import setup from '../internal/setup';

export enum ResultTypes {
  Add = '[Add] result',
  Set = '[Set] result',
  Bump = '[Bump] result',
  Get = '[Get] result',
  Check = '[Check] result',
  Remove = '[Remove] result',
}

export type Events =
  | AddEvents
  | RemoveEvents
  | IntegrityEvents
  | SetEvents
  | GetEvents
  | CommonEvents;

export type Results =
  | AddDependencyResult
  | RemoveDependencyResult
  | SetVersionResult
  | BumpVersionResult
  | GetVersionResult
  | CheckIntegrityResult;

export default {
  async add({
    name,
    version,
    parent,
    type,
  }: {
    name: string;
    version?: string;
    parent: string | null;
    type: 'dev' | 'direct';
  }) {
    if (!version) {
      version = 'latest';
    }

    const locations = await findLocations();
    const registry = await createRegistry(locations);

    version = await ensureVersionOf({
      name,
      version,
      registry,
    });

    if (parent === null) {
      parent = registry[setup.cwd].name;
    }

    await addDependency({
      name,
      registry,
      type,
      parent,
      version,
    });

    await runHook(
      {
        type: 'add',
        data: {
          name,
          version,
          type,
          parent,
        },
      },
      locations,
    );

    return new AddDependencyResult({
      name,
      version,
      type,
      parent,
    });
  },
  async remove({name, parent}: {name: string; parent: string | null}) {
    const locations = await findLocations();
    const registry = await createRegistry(locations);

    if (parent === null) {
      parent = registry[setup.cwd].name;
    }

    await removeDependency({
      name,
      registry,
      parent,
    });

    await runHook(
      {
        type: 'remove',
        data: {
          name,
          parent,
        },
      },
      locations,
    );

    return new RemoveDependencyResult({
      name,
      parent,
    });
  },
  async check(name?: string) {
    const registry = await createRegistry(await findLocations());

    const result = await checkIntegrity({
      name,
      registry,
    });

    if (hasIntegrity(result)) {
      return new CheckIntegrityResult({
        name,
        result,
      });
    } else {
      throw new NoIntegrityEvent({
        result,
      });
    }
  },
  async set(name: string, version: string) {
    const locations = await findLocations();
    const registry = await createRegistry(locations);

    if (isTag(version) && !isLocal(name, registry)) {
      version = await fetchVersionByTag(name, version);
    }

    if (isLocal(name, registry) && isTag(version)) {
      throw new TagOnLocalPackageEvent({
        name,
      });
    }

    await setVersionOf({
      name,
      version,
      registry,
    });

    await runHook(
      {
        type: 'version',
        data: {
          name,
          version,
        },
      },
      locations,
    );

    return new SetVersionResult({
      name,
      version,
    });
  },
  async bump(name: string, type: ReleaseType) {
    const locations = await findLocations();
    const registry = await createRegistry(locations);

    const version = await bumpVersionOf({
      name,
      type,
      registry,
    });

    await runHook(
      {
        type: 'version',
        data: {
          name,
          version,
        },
      },
      locations,
    );

    return new BumpVersionResult({
      name,
      version,
    });
  },
  async get(name: string) {
    const registry = await createRegistry(await findLocations());

    const version = await getVersionOf({
      name,
      registry,
    });

    return new GetVersionResult({
      name,
      version,
    });
  },
};

export class AddDependencyResult implements Event {
  type = ResultTypes.Add;

  constructor(
    public payload: {
      name: string;
      version: string;
      type: 'dev' | 'direct';
      parent: string;
    },
  ) {}
}

export class RemoveDependencyResult implements Event {
  type = ResultTypes.Remove;

  constructor(
    public payload: {
      name: string;
      parent: string;
    },
  ) {}
}

export class SetVersionResult implements Event {
  type = ResultTypes.Set;

  constructor(
    public payload: {
      name: string;
      version: string;
    },
  ) {}
}

export class BumpVersionResult implements Event {
  type = ResultTypes.Bump;

  constructor(
    public payload: {
      name: string;
      version: string;
    },
  ) {}
}

export class GetVersionResult implements Event {
  type = ResultTypes.Get;

  constructor(
    public payload: {
      name: string;
      version: string | Dependency;
    },
  ) {}
}

export class CheckIntegrityResult implements Event {
  type = ResultTypes.Check;

  constructor(
    public payload: {
      name?: string;
      result: IntegrityResult;
    },
  ) {}
}
