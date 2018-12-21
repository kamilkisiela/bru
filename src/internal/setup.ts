import { FileSystem, fs } from './file';

class Setup {
  private _cwd: string = process.cwd();
  private _fs: FileSystem = fs;

  // cwd
  get cwd() {
    return this._cwd;
  }
  set cwd(cwd: string) {
    this._cwd = cwd;
  }

  // fs
  get fs() {
    return this._fs;
  }
  set fs(filesystem: FileSystem) {
    this._fs = filesystem;
  }
}

export default new Setup();
