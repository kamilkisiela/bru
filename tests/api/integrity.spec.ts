import { resolve } from 'path';
import { setCWD } from '../../src/consts';
import { checkIntegrity, hasIntegrity } from '../../src/api/integrity';

describe('integrity', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);

      setCWD(cwd);

      const graphqlResult = await checkIntegrity('graphql');
      const graphqlParents = Object.keys(graphqlResult.graphql.parents);

      expect(graphqlResult.graphql.integrity).toEqual(true);
      expect(graphqlParents).toContainEqual('@example/core');
      expect(graphqlParents).toContainEqual('@example/react');
      expect(graphqlParents).toContainEqual('@example/angular');
      expect(graphqlParents).toContainEqual(`${manager}-example`);
      expect(hasIntegrity(graphqlResult)).toEqual(true);
    });
  });
});
