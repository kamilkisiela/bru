import * as symbols from 'log-symbols';
// api
import {
  Events,
  Results,
  ResultTypes,
  AddDependencyResult,
  BumpVersionResult,
  CheckIntegrityResult,
  GetVersionResult,
  SetVersionResult,
} from './api';
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

const resultHandlers = {
  [ResultTypes.Add]: renderAddResult,
  [ResultTypes.Bump]: renderBumpResult,
  [ResultTypes.Check]: renderCheckResult,
  [ResultTypes.Get]: renderGetResult,
  [ResultTypes.Set]: renderSetResult,
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
  success(result: Results) {
    if (resultHandlers[result.type]) {
      // FIX: it ,---,*
      (resultHandlers[result.type] as any)(result);
    } else {
      console.log(asSuccess('Success!'));
    }
  },
};

export function isEvent(event: any): event is Events {
  return !!(event as any).type;
}

// Errors

function renderMissingLocal(event: MissingLocalPackageEvent) {
  const { name } = event.payload;
  console.log(asError(`Module ${name} is not available in your project`));
}

function renderMissingPackage(
  event: MissingPackageEvent | MissingLocalPackageCheckEvent,
) {
  const { name } = event.payload;
  console.log(asError(`Module ${name} is not available in your project`));
}

function renderIncorrectBympType(event: IncorrectBumpTypeEvent) {
  const { name, type } = event.payload;
  console.log(asError(`Failed to bump ${name} to ${type}`));
}

function renderMultipleVersions(event: MultipleVersionEvent) {
  const { name } = event.payload;
  console.log(asError(`Module ${name} has multiple versions`));
}

function renderTagOnLocal(event: TagOnLocalPackageEvent) {
  const { name } = event.payload;
  console.log(asError(`Can't use a dist-tag on a local package ${name}`));
}

function renderNoIntegrity(event: NoIntegrityEvent) {
  const result = event.payload.result;
  const logger = useLogger();

  logger.schedule(asError(`Multiple versions found`));

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

// Results

function renderAddResult(result: AddDependencyResult): void {
  const { name, parent, version, type } = result.payload;
  console.log(
    asSuccess(
      `Package ${name}@${version} added to ${parent} as ${type} dependency`,
    ),
  );
}
function renderBumpResult(result: BumpVersionResult): void {
  const { name, version } = result.payload;
  console.log(asSuccess(`${name} was bumped to ${version}`));
}
function renderCheckResult(result: CheckIntegrityResult): void {
  const { name } = result.payload;
  console.log(asSuccess(`No multiple versions ${name ? `of ${name}` : ''}`));
}
function renderGetResult(result: GetVersionResult): void {
  const { name, version } = result.payload;
  console.log(asSuccess(`${name} is ${version}`));
}
function renderSetResult(result: SetVersionResult): void {
  const { name, version } = result.payload;
  console.log(asSuccess(`${name} is now ${version}`));
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
