import * as symbols from 'log-symbols';
// api
import { Events, Results } from './api';
import { AddTypes, MissingLocalPackageEvent } from './api/add';
import { GetTypes, MissingPackageEvent } from './api/get';
import {
  SetTypes,
  IncorrectBumpTypeEvent,
  MultipleVersionEvent,
} from './api/set';
import {
  IntegrityTypes,
  NoIntegrityEvent,
  MissingPackageEvent as MissingLocalPackageCheckEvent,
} from './api/check';
// internal
import { CommonTypes, TagOnLocalPackageEvent } from './internal/events';

export interface Renderer {
  error(event: Events | Error): void;
  success(info: Results): void;
}

const errorHandlers = {
  [CommonTypes.TagOnLocal]: renderTagOnLocal,
  [AddTypes.MissingLocal]: renderMissingLocal,
  [GetTypes.MissingPackage]: renderMissingPackage,
  [SetTypes.IncorrectType]: renderIncorrectBympType,
  [SetTypes.Multiple]: renderMultipleVersions,
  [IntegrityTypes.MissingPackage]: renderMissingPackage,
  [IntegrityTypes.NoIntegrity]: renderNoIntegrity,
};

export const defaultRenderer: Renderer = {
  error(event) {
    if (isEvent(event)) {
      if (errorHandlers[event.type]) {
        // FIX: it ,---,*
        (errorHandlers[event.type] as any)(event);
      }
    } else {
      console.log(asError(`Error occured: ${event}`));
      console.error(event);
    }
  },
  success() {
    console.log(asSuccess('Success!'));
  },
};

export function isEvent(event: any): event is Events {
  return !!(event as any).type;
}

function renderMissingLocal(event: MissingLocalPackageEvent) {
  console.log(
    asError(`Module ${event.payload.name} is not available in your project`),
  );
}

function renderMissingPackage(
  event: MissingPackageEvent | MissingLocalPackageCheckEvent,
) {
  console.log(
    asError(`Module ${event.payload.name} is not available in your project`),
  );
}

function renderIncorrectBympType(event: IncorrectBumpTypeEvent) {
  console.log(
    asError(`Failed to bump ${event.payload.name} to ${event.payload.type}`),
  );
}

function renderMultipleVersions(event: MultipleVersionEvent) {
  console.log(asError(`Module ${event.payload.name} has multiple version`));
}

function renderTagOnLocal(event: TagOnLocalPackageEvent) {
  console.log(
    asError(`Can't use a dist-tag on a local package ${event.payload.name}`),
  );
}

function renderNoIntegrity(event: NoIntegrityEvent) {
  const result = event.payload.result;
  const logger = useLogger();

  logger.schedule(asSuccess(`Multiple versions`));

  for (const packageName in result) {
    if (result.hasOwnProperty(packageName)) {
      const info = result[packageName];

      if (!info.integrity) {
        // store <version, packages> map
        const versions: { [version: string]: string[] } = {};

        logger.schedule(withIndent(1, packageName));

        // assign packages to versions
        for (const name in info.parents) {
          if (info.parents.hasOwnProperty(name)) {
            const parent = info.parents[name];

            if (parent.direct) {
              if (!versions[parent.direct]) {
                versions[parent.direct] = [];
              }
              versions[parent.direct].push(name);
            }

            if (parent.dev) {
              if (!versions[parent.dev]) {
                versions[parent.dev] = [];
              }
              versions[parent.dev].push(name);
            }
          }
        }

        Object.keys(versions).forEach(version => {
          const packages = versions[version].filter(
            (val, i, all) => all.indexOf(val) === i,
          );

          // version: p,a,c,k,a,g,e,s
          logger.schedule(withIndent(2, `${version}: ${packages.join(', ')}`));
        });

        // emit logs
        logger.commit();
      }
    }
  }
}

function useLogger() {
  let logs: string[] = [];

  return {
    schedule(msg: string) {
      logs.push(msg);
    },
    commit() {
      logs.forEach(msg => console.log(msg));
      logs = [];
    },
  };
}

function withIndent(size: number, msg: string): string {
  return `${'  '.repeat(size)}${msg}`;
}

function asError(msg: string): string {
  return `${symbols.error} ${msg}`;
}

function asSuccess(msg: string): string {
  return `${symbols.success} ${msg}`;
}
