import Machine from "./models/machine.ts";
import * as path from "https://deno.land/std@0.95.0/path/mod.ts";

export default class MockFS {
  private _fs: { [key: string]: string | null };
  constructor(private machine: Machine) {
    this._fs = JSON.parse(this.machine.filesystem as string);
  }
  public async update(): Promise<void> {
    this.machine.filesystem = JSON.stringify(this._fs);
    await this.machine.update();
  }
  // deno-lint-ignore require-await
  public async readFile(p: string): Promise<string> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    if (f == undefined) throw new Error("Path does not exist.");
    if (f == null) throw new Error("Cannot read directory as file.");
    return f;
  }
  // deno-lint-ignore require-await
  public async isFile(p: string): Promise<boolean> {
    if (!path.isAbsolute(p)) p = path.resolve("/", p);
    const f = this._fs[p];
    return f != undefined && f != null;
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
