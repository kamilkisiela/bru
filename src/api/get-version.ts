import { connect, createRegistry, Dependency } from '../registry';
import { scan } from '../scanner';
import { checkIntegrity } from './integrity';

export async function getVersionOf(name: string): Promise<string | Dependency> {
  const locations = await scan();
  const registry = await createRegistry(locations);
  const graph = connect(registry);
  const dep = graph.getNodeData(name);

  if (!dep) {
    throw new Error(`Module ${name} is not available in your project`);
  }

  // optimize that
  const hasIntegrity = await checkIntegrity(name);

  if (hasIntegrity) {
    const first = dep[Object.keys(dep)[0]];

    return (first.direct || first.dev)!;
  }

  return dep;
}
