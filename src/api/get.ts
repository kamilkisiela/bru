// api
import { checkIntegrity } from './check';
// internal
import { createGraph, Dependency, Registry } from '../internal/registry';
import { Event } from '../internal/events';

export enum GetTypes {
  MissingPackage = '[Get] Missing package',
}

export type GetEvents = MissingPackageEvent;

export async function getVersionOf({
  name,
  registry,
}: {
  name: string;
  registry: Registry;
}): Promise<string | Dependency> {
  const graph = createGraph(registry);

  if (!graph.hasNode(name)) {
    throw new MissingPackageEvent({
      name,
    });
  }

  const dep = graph.getNodeData(name);

  const hasIntegrity = await checkIntegrity({
    name,
    registry,
  });

  if (hasIntegrity) {
    const first = dep[Object.keys(dep)[0]];

    return (first.direct || first.dev)!;
  }

  return dep;
}

export class MissingPackageEvent implements Event {
  type = GetTypes.MissingPackage;

  constructor(
    public payload: {
      name: string;
    },
  ) {}
}
