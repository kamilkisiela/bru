import chalk from 'chalk';
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
  RemoveDependencyResult,
} from './api';
import {AddTypes, MissingLocalPackageEvent} from './api/add';
import {GetTypes, MissingPackageEvent} from './api/get';
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
import {
  RemoveTypes,
  MissingLocalPackageEvent as MissingLocalPackageRemoveEvent,
} from './api/remove';
// internal
import {CommonTypes, TagOnLocalPackageEvent} from './internal/events';
import {Dependency} from './internal/registry';

export interface Renderer {
  error(event: Events | Error): void;
  success(info: Results): void;
}

const errorHandlers = {
  [CommonTypes.TagOnLocal]: renderTagOnLocal,
  [AddTypes.MissingLocal]: renderMissingLocal,
  [RemoveTypes.MissingLocal]: renderMissingLocal,
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
  [ResultTypes.Remove]: renderRemoveResult,
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
  const {name} = event.payload;
  console.log(
    asError(`Module ${chalk.bold(name)} is not available in your project`),
  );
}

function renderMissingPackage(
  event:
    | MissingPackageEvent
    | MissingLocalPackageCheckEvent
    | MissingLocalPackageRemoveEvent,
) {
  const {name} = event.payload;
  console.log(
    asError(`Module ${chalk.bold(name)} is not available in your project`),
  );
}

function renderIncorrectBympType(event: IncorrectBumpTypeEvent) {
  const {name, type} = event.payload;
  console.log(
    asError(`Failed to bump ${chalk.bold(name)} to ${chalk.bold(type)}`),
  );
}

function renderMultipleVersions(event: MultipleVersionEvent) {
  const {name} = event.payload;
  console.log(asError(`Module ${chalk.bold(name)} has multiple versions`));
}

function renderTagOnLocal(event: TagOnLocalPackageEvent) {
  const {name} = event.payload;
  console.log(
    asError(`Can't use a dist-tag on a local package ${chalk.bold(name)}`),
  );
}

function renderNoIntegrity(event: NoIntegrityEvent) {
  const result = event.payload.result;
  const logger = useLogger();

  logger.schedule(asError(`Multiple versions found`));

  for (const packageName in result) {
    if (result.hasOwnProperty(packageName)) {
      const info = result[packageName];

      if (!info.integrity) {
        printDependency(packageName, info.parents, logger.schedule);

        // emit logs
        logger.commit();
      }
    }
  }
}

// Results

function renderAddResult(result: AddDependencyResult): void {
  const {name, parent, version, type} = result.payload;
  console.log(
    asSuccess(
      `Package ${chalk.bold(name)}@${chalk.bold(version)} added to ${chalk.bold(
        parent,
      )} as ${chalk.bold(type)} dependency`,
    ),
  );
}

function renderBumpResult(result: BumpVersionResult): void {
  const {name, version} = result.payload;
  console.log(
    asSuccess(`${chalk.bold(name)} was bumped to ${chalk.bold(version)}`),
  );
}

function renderCheckResult(result: CheckIntegrityResult): void {
  const {name} = result.payload;
  console.log(
    asSuccess(`No multiple versions ${name ? `of ${chalk.bold(name)}` : ''}`),
  );
}

function renderGetResult(result: GetVersionResult): void {
  const {name, version} = result.payload;
  const logger = useLogger();

  if (typeof version === 'string') {
    logger.schedule(asSuccess(`${chalk.bold(name)} is ${chalk.bold(version)}`));
  } else {
    logger.schedule(asError(`Multiple versions`));
    logger.break();
    printDependency(name, version, logger.schedule);
  }

  logger.commit();
}

function renderSetResult(result: SetVersionResult): void {
  const {name, version} = result.payload;
  console.log(asSuccess(`${chalk.bold(name)} is now ${chalk.bold(version)}`));
}

function renderRemoveResult(result: RemoveDependencyResult): void {
  const {name, parent} = result.payload;
  console.log(
    asSuccess(`${chalk.bold(name)} removed from ${chalk.bold(parent)}`),
  );
}

// other

function printDependency(
  name: string,
  dep: Dependency,
  onLog: (...msgs: string[]) => void,
) {
  const versions: {[version: string]: string[]} = {};

  onLog(name);

  // assign packages to versions
  for (const name in dep) {
    if (dep.hasOwnProperty(name)) {
      const parent = dep[name];

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

  Object.keys(versions).forEach((version, i, all) => {
    const isLast = all.length === i + 1;
    const packages = versions[version].filter(
      (val, i, all) => all.indexOf(val) === i,
    );

    // version: p,a,c,k,a,g,e,s
    onLog(
      chalk.gray(isLast ? '└─' : '├─'),
      version,
      chalk.gray.italic(`(${packages.length})`),
      chalk.gray(packages.join(', ')),
    );
  });
}

// utils

function useLogger() {
  let logs: string[] = [];

  return {
    schedule(...msgs: string[]) {
      logs.push(msgs.join(' '));
    },
    break() {
      logs.push('');
    },
    commit() {
      logs.forEach(msg => console.log(msg));
      logs = [];
    },
  };
}

// function withIndent(size: number, msg: string): string {
//   return `${'  '.repeat(size)}${msg}`;
// }

function asError(msg: string): string {
  return `${chalk.redBright('error')} ${msg}`;
}

function asSuccess(msg: string): string {
  return `${chalk.greenBright('success')} ${msg}`;
}
