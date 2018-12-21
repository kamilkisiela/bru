import { connect, createRegistry, Dependency } from '../registry';
import { scan } from '../scanner';

interface Result {
  integrity: boolean;
  parents: Dependency;
}

export interface IntegrityResult {
  [packageName: string]: Result;
}

export async function checkIntegrity(name?: string): Promise<IntegrityResult> {
  const locations = await scan();
  const registry = await createRegistry(locations);
  const graph = connect(registry);

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
      ? versions.some((val, i, all) => all.indexOf(val) !== i)
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
