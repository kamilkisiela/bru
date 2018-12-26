import * as symbols from 'log-symbols';
// api
import { Events, Results } from './api';
import { AddTypes } from './api/add';
import { GetTypes } from './api/get';
import { SetTypes } from './api/set';
import { IntegrityTypes, IntegrityResult } from './api/check';
// internal
import { CommonTypes } from './internal/events';

export interface Renderer {
  error(event: Events | Error): void;
  success(info: Results): void;
}

export const defaultRenderer: Renderer = {
  error(event) {
    if (isEvent(event)) {
      switch (event.type) {
        case AddTypes.MissingLocal:
          console.log(
            symbols.error,
            `Module ${event.payload.name} is not available in your project`,
          );
          break;
        case GetTypes.MissingPackage:
          console.log(
            symbols.error,
            `Module ${event.payload.name} is not available in your project`,
          );
          break;
        case SetTypes.IncorrectType:
          console.log(
            symbols.error,
            // FIX: ,....,*
            `Failed to bump ${event.payload.name} to ${
              (event.payload as any).type
            }`,
          );
          break;
        case SetTypes.Multiple:
          console.log(
            symbols.error,
            `Module ${event.payload.name} has multiple version`,
          );
          break;
        case IntegrityTypes.MissingPackage:
          console.log(
            symbols.error,
            // FIX: ,....,*
            `Module ${
              (event.payload as any).name
            } is not available in your project`,
          );
          break;
        case IntegrityTypes.NoIntegrity:
          renderNoIntegrity((event.payload as any).result);
          break;
        case CommonTypes.TagOnLocal:
          console.log(
            symbols.error,
            `Can't use a dist-tag on a local package ${event.payload.name}`,
          );
          break;
      }
    } else {
      console.log(symbols.error, `Error occured: ${event}`);
      console.error(event);
    }
  },
  success() {
    console.log(symbols.success, 'Success!');
  },
};

export function isEvent(event: any): event is Events {
  return !!(event as any).type;
}

function renderNoIntegrity(result: IntegrityResult) {
  console.log(symbols.error, `Multiple versions`);

  for (const packageName in result) {
    if (result.hasOwnProperty(packageName)) {
      const info = result[packageName];

      if (!info.integrity) {
        console.log(' ', packageName);
        for (const name in info.parents) {
          if (info.parents.hasOwnProperty(name)) {
            const parent = info.parents[name];

            console.log(`    ${name}`);

            if (parent.direct) {
              console.log(`      - ${parent.direct}`);
            }

            if (parent.dev) {
              console.log(`      - ${parent.dev} [dev]`);
            }
          }
        }
      }
    }
  }
}
