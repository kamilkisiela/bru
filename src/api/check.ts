// internal
import { createGraph, Dependency, Registry } from '../internal/registry';
import { Event } from '../internal/events';

export enum IntegrityTypes {
  MissingPackage = '[Integrity] Missing package',
  NoIntegrity = '[Integrity] No integrity',
}
export type IntegrityEvents = MissingPackageEvent | NoIntegrityEvent;

interface Result {
  integrity: boolean;
  parents: Dependency;
}

export interface IntegrityResult {
  [packageName: string]: Result;
}

export async function checkIntegrity({
  name,
  registry,
}: {
  name?: string;
  registry: Registry;
}): Promise<IntegrityResult> {
  const graph = createGraph(registry);

  if (name) {
    const dep = graph.getNodeData(name);

    return {
      [name]: integrityOf(dep),
    };
  }

  const result: IntegrityResult = {};

  graph.overallOrder().forEach(depName => {
    const dep = graph.getNodeData(depName);

    result[depName] = integrityOf(dep);
  });

  return result;
}

function integrityOf(dep: Dependency): Result {
  const versions = Object.keys(dep).reduce<string[]>((versions, name) => {
    const pkg = dep[name];
    return versions.concat([pkg.dev, pkg.direct].filter(isString));
  }, []);

  const integrity =
    versions && versions.length > 1
      ? !versions.some(ver => ver !== versions[0])
      : true;

  return {
    integrity,
    parents: dep,
  };
}

export function hasIntegrity(result: IntegrityResult): boolean {
  return !Object.keys(result).some(name => !result[name].integrity);
}

function isString(v: any): v is string {
  return typeof v === 'string';
}

export class MissingPackageEvent implements Event {
  type = IntegrityTypes.MissingPackage;

  constructor(
    public payload: {
      name: string;
    },
  ) {}
}

export class NoIntegrityEvent implements Event {
  type = IntegrityTypes.NoIntegrity;

  constructor(
    public payload: {
      result: IntegrityResult;
    },
  ) {}
}
