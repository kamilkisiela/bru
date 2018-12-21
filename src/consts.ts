let _CWD = process.cwd();

export function getCWD() {
  return _CWD;
}

export function setCWD(cwd: string) {
  _CWD = cwd;
}
