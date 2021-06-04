import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import { machines } from "../database.ts";
import { Document } from "https://deno.land/x/darango/mod.ts";
import { ArangoMachine } from "./mod.ts";

const defaultFS = JSON.stringify({
  "/": null,
  "/home": null,
  "/usr": null,
  "/usr/bin": null,
});

export default class Machine {
  static async new(username?: string): Promise<Document<ArangoMachine>> {
    let fs = defaultFS;
    if (username !== undefined) {
      const obj: { [key: string]: string | null } = JSON.parse(fs);
      obj[`/home/${username}`] = null;
      fs = JSON.stringify(obj);
    }
    return await machines.create({
      uuid: v4.generate(),
      filesystem: fs,
    });
  }
  static async findMachine(
    uuid: string,
  ): Promise<Document<ArangoMachine> | null> {
    const res = await machines.find({ uuid });
    return res.length > 0 ? res[0] : null;
  }
}
