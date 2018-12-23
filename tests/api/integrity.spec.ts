import { resolve } from 'path';
import setup from '../../src/internal/setup';
import { managers } from '../common';
import api from '../../src/api';
import { hasIntegrity } from '../../src/api/integrity';

describe('Integrity', () => {
  managers.forEach(manager => {
    describe(manager, () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);

      beforeEach(async () => {
        setup.cwd = cwd;
      });

      test('single dependency (external)', async () => {
        const result = await api.check('graphql');

        expect(result.graphql.integrity).toEqual(true);
        expect(result.graphql.parents).toHaveProperty('@example/core');
        expect(result.graphql.parents).toHaveProperty('@example/react');
        expect(result.graphql.parents).toHaveProperty('@example/angular');
        expect(result.graphql.parents).toHaveProperty(`${manager}-example`);
        expect(hasIntegrity(result)).toEqual(true);
      });

      test('unused package (local)', async () => {
        const result = await api.check('@example/angular');

        expect(result['@example/angular'].integrity).toEqual(true);
      });

      test('package used once (external)', async () => {
        const result = await api.check('react');

        expect(result['react'].integrity).toEqual(true);
      });
      test('of all', async () => {
        const {
          graphql,
          ['@example/angular']: exampleAngular,
          react,
        } = await api.check();

        // graphql
        expect(graphql.integrity).toEqual(true);
        expect(graphql.parents).toHaveProperty('@example/core');
        expect(graphql.parents).toHaveProperty('@example/react');
        expect(graphql.parents).toHaveProperty('@example/angular');
        expect(graphql.parents).toHaveProperty(`${manager}-example`);
        // angular
        expect(exampleAngular.integrity).toEqual(true);
        // react
        expect(react.integrity).toEqual(true);
      });
    });
  });
});
