import { resolve, join } from 'path';

import { setCWD } from '../src/consts';
import { scan } from '../src/scanner';
import { createRegistry, connect } from '../src/registry';

describe('Basic', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      const cwd = resolve(__dirname, `../example/${manager}`);
      
      setCWD(cwd);
      
      const locations = await scan();

      expect(locations.length).toEqual(4);
      expect(locations.every(loc => loc.startsWith(cwd))).toEqual(true);

      const registry = await createRegistry(locations);

      expect(Object.keys(registry).length).toEqual(4);

      // root
      expect(registry[cwd]).toMatchObject({
        name: `${manager}-example`,
        version: '0.0.0',
        private: true,
        dependencies: {
          graphql: '14.0.2',
        },
      });

      // angular
      expect(registry[join(cwd, 'packages/angular')]).toMatchObject({
        name: '@example/angular',
        version: '1.0.0',
        dependencies: {
          '@example/core': '1.1.0',
          '@angular/core': '6.1.10',
          graphql: '14.0.2',
        },
      });

      // core
      expect(registry[join(cwd, 'packages/core')]).toMatchObject({
        name: '@example/core',
        version: '1.1.0',
        dependencies: {
          graphql: '14.0.2',
        },
      });

      // react
      expect(registry[join(cwd, 'packages/react')]).toMatchObject({
        name: '@example/react',
        version: '1.0.0',
        dependencies: {
          '@example/core': '1.1.0',
          react: '16.5.2',
          graphql: '14.0.2',
        },
      });

      const graph = connect(registry);

      // @angular/core  -> angular
      expect(graph.dependantsOf('@angular/core').length).toEqual(1);
      // react          -> react
      expect(graph.dependantsOf('react').length).toEqual(1);
      // graphql        -> root, angular, core, react
      expect(graph.dependantsOf('graphql').length).toEqual(4);
      // angular        -> ...
      expect(graph.dependantsOf('@example/angular').length).toEqual(0);
      // react          -> ...
      expect(graph.dependantsOf('@example/react').length).toEqual(0);
      // core           -> angular, react
      expect(graph.dependantsOf('@example/core').length).toEqual(2);

      expect(graph.size()).toEqual(3 + (manager === 'lerna' ? 5 : 4));

      const graphql = {
        node: graph.getNodeData('graphql'),
        version: '14.0.2'
      };
      // graphql at core
      expect(graphql.node['@example/core']).toMatchObject({
        direct: graphql.version,
      });
      // graphql at angular
      expect(graphql.node['@example/angular']).toMatchObject({
        direct: graphql.version,
      });
      // graphql at react
      expect(graphql.node['@example/react']).toMatchObject({
        direct: graphql.version,
      });
      // graphql at root
      expect(graphql.node[`${manager}-example`]).toMatchObject({
        direct: graphql.version,
      });
    });
  });
});
