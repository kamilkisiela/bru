export interface Event {
  type: string;
}

export enum CommonTypes {
  TagOnLocal = '[Common] Tag on local package',
}
export type CommonEvents = TagOnLocalPackageEvent;

export class TagOnLocalPackageEvent implements Event {
  type = CommonTypes.TagOnLocal;

  constructor(
    public payload: {
      name: string;
    },
  ) {}
}
