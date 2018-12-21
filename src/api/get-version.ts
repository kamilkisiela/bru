import { connect, Dependency, Registry } from '../internal/registry';
import { checkIntegrity } from './integrity';

export async function getVersionOf({
  name,
  registry,
}: {
  name: string;
  registry: Registry;
}): Promise<string | Dependency> {
  const graph = connect(registry);
  const dep = graph.getNodeData(name);

  if (!dep) {
    throw new Error(`Module ${name} is not available in your project`);
  }

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
