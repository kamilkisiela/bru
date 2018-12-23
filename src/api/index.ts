import { createRegistry, ensureVersionOf, isLocal } from '../internal/registry';
import { findLocations } from '../internal/manager';
import { addDependency } from './add';
import { checkIntegrity } from './integrity';
import { isTag } from '../internal/utils';
import { fetchVersionByTag } from '../internal/npm-api';
import { setVersionOf, bumpVersionOf } from './set-version';
import { getVersionOf } from './get-version';
import { ReleaseType } from 'semver';

export default {
  async add({
    name,
    version,
    parent,
    type,
  }: {
    name: string;
    version?: string;
    parent: string;
    type: 'dev' | 'direct';
  }) {
    if (!version) {
      version = 'latest';
    }

    const registry = await createRegistry(await findLocations());

    await addDependency({
      name,
      registry,
      type,
      parent,
      version: await ensureVersionOf({
        name,
        version,
        registry,
      }),
    });
  },
  async check(name?: string) {
    const registry = await createRegistry(await findLocations());

    return checkIntegrity({
      name,
      registry,
    });
  },
  async set(name: string, version: string) {
    const registry = await createRegistry(await findLocations());

    if (isTag(version) && !isLocal(name, registry)) {
      version = await fetchVersionByTag(name, version);
    }

    if (isLocal(name, registry) && isTag(version)) {
      throw new Error(`Can't use a dist-tag on a local package ${name}`);
    }

    await setVersionOf({
      name,
      version,
      registry,
    });
  },
  async bump(name: string, type: ReleaseType) {
    const registry = await createRegistry(await findLocations());

    await bumpVersionOf({
      name,
      type,
      registry,
    });
  },
  async get(name: string) {
    const registry = await createRegistry(await findLocations());

    return getVersionOf({
      name,
      registry,
    });
  }
};
