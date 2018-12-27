import { resolve } from 'path';
import setup from '../../src/internal/setup';
import { updatePackages, fs } from '../../src/internal/fs';
import { managers } from '../common';
import api from '../../src/api';
import { hasIntegrity, NoIntegrityEvent } from '../../src/api/check';

describe('Integrity', () => {
  afterEach(() => {
    setup.fs = fs;
  });
  
  test('hasIntegrity', () => {
    // all true
    expect(
      hasIntegrity({
        foo: { integrity: true, parents: {} },
        bar: { integrity: true, parents: {} },
      }),
    ).toEqual(true);

    // all false
    expect(
      hasIntegrity({
        foo: { integrity: false, parents: {} },
        bar: { integrity: false, parents: {} },
      }),
    ).toEqual(false);

    // all and one false
    expect(
      hasIntegrity({
        foo: { integrity: true, parents: {} },
        bar: { integrity: false, parents: {} },
      }),
    ).toEqual(false);

    // single and true
    expect(
      hasIntegrity({
        foo: { integrity: true, parents: {} },
      }),
    ).toEqual(true);

    // single and false
    expect(
      hasIntegrity({
        foo: { integrity: false, parents: {} },
      }),
    ).toEqual(false);

    // empty
    expect(hasIntegrity({})).toEqual(true);
  });

  managers.forEach(manager => {
    describe(manager, () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);

      beforeEach(async () => {
        setup.cwd = cwd;
        
      });

      test.skip('single dependency (external) with multiple versions', async () => {
        const updater = updatePackages();
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        updater.change({
          type: 'UPDATE',
          name: 'graphql',
          version: '14.0.3',
          location: cwd
        });
        await updater.commit();

        let event: NoIntegrityEvent | undefined = undefined;
        
        try {
          await api.check('graphql');
        } catch (e) {
          event = e;
        }

        updater.change({
          type: 'UPDATE',
          name: 'graphql',
          version: '14.0.2',
          location: cwd
        });
        await updater.commit();

        expect(event).toBeDefined();

        const { payload } = event!;

        expect(payload.result.graphql.integrity).toEqual(false);
        expect(payload.result.graphql.parents).toHaveProperty('@example/core');
        expect(payload.result.graphql.parents).toHaveProperty('@example/react');
        expect(payload.result.graphql.parents).toHaveProperty(
          '@example/angular',
        );
        expect(payload.result.graphql.parents).toHaveProperty(
          `${manager}-example`,
        );
        expect(hasIntegrity(payload.result)).toEqual(false);
      });

      test('single dependency (external)', async () => {
        const { payload } = await api.check('graphql');

        expect(payload.name).toEqual('graphql');
        expect(payload.result.graphql.integrity).toEqual(true);
        expect(payload.result.graphql.parents).toHaveProperty('@example/core');
        expect(payload.result.graphql.parents).toHaveProperty('@example/react');
        expect(payload.result.graphql.parents).toHaveProperty(
          '@example/angular',
        );
        expect(payload.result.graphql.parents).toHaveProperty(
          `${manager}-example`,
        );
        expect(hasIntegrity(payload.result)).toEqual(true);
      });

      test('unused package (local)', async () => {
        const { payload } = await api.check('@example/angular');

        expect(payload.result['@example/angular'].integrity).toEqual(true);
      });

      test('package used once (external)', async () => {
        const { payload } = await api.check('react');

        expect(payload.result['react'].integrity).toEqual(true);
      });
      test('of all', async () => {
        const { payload } = await api.check();

        const {
          graphql,
          ['@example/angular']: exampleAngular,
          react,
        } = payload.result;

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
