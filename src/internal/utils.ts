export function pickProp<T>(obj: T | undefined, key: keyof T) {
  return obj && obj[key];
}

export function updateProp<T>(
  obj: T | undefined,
  key: keyof T,
  value: any,
): void {
  if (obj) {
    obj[key] = value;
  }
}

export function ensureProp<T>(
  obj: T,
  prop: keyof T,
  key: keyof T[keyof T],
  value: any,
): void {
  if (!obj[prop]) {
    obj[prop] = {} as any;
  }

  obj[prop][key] = value;
}

export function isTag(tag: string): boolean {
  return !tag.includes('.');
}
