import Machine from "./models/machine.ts";
import { posix as path } from "https://deno.land/std@0.95.0/path/mod.ts";

export default class MockFS {
  private _fs: { [key: string]: string | null };
  constructor(private machine: Machine) {
    if (typeof machine.filesystem == "string") {
      this._fs = JSON.parse(this.machine.filesystem as string);
    } else {
      this._fs = this.machine.filesystem as unknown as {
        [key: string]: string | null;
      };
    }
  }
  private async update(): Promise<void> {
    this.machine.filesystem = JSON.stringify(this._fs);
    await this.machine.update();
  }
  public async readFile(p: string): Promise<string> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    if (f == null) throw new Error("Cannot read directory as file.");
    else if (f == undefined) throw new Error(`Path '${p}' does not exist.`);
    return f;
  }
  public async isFile(p: string): Promise<boolean> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    return f != undefined && f != null;
  }
  public async mkdir(p: string): Promise<void> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    if (f == null || typeof f == "string") {
      throw new Error("Path already exists.");
    }
    this._fs[p] = null;
    await this.update();
  }
  public async readDir(p: string): Promise<string[]> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const res: string[] = [];
    const f = this._fs[p];
    if (typeof f == "string") throw new Error("Cannot read file as directory.");
    else if (f != null) throw new Error(`Path '${p}' does not exist.`);
    res.push(
      ...Object.keys(this._fs).filter((k) => k.startsWith(p) && k != p).map((
        k,
      ) => k.replace(p, "")).filter((k) => k.lastIndexOf("/") <= 0).map((k) =>
        k.replace("/", "")
      ),
    );
    return res;
  }
  public async writeFile(p: string, data: string): Promise<void> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    if (f == null) throw new Error("Cannot write to a directory.");
    this._fs[p] = data;
    await this.update();
  }
  public static async getFilesystem(mid: string): Promise<MockFS> {
    const machine = await Machine.findMachine(mid);
    if (machine == null) throw new Error("Machine not found.");
    return new MockFS(machine);
  }
}
