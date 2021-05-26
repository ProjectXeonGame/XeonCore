import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import db from "../database.ts";
import { Document } from "https://deno.land/x/darango/mod.ts";

const machines = await db.collection<ArangoMachine>("machines");

const defaultFS = JSON.stringify({
  "/": null,
  "/home": null,
  "/usr": null,
  "/usr/bin": null,
});

export interface ArangoMachine {
  uuid: string;
  filesystem: string;
}

export default class Machine {
  static async new(): Promise<Document<ArangoMachine>> {
    return await machines.create({
      uuid: v4.generate(),
      filesystem: defaultFS,
    });
  }
  static async findMachine(
    uuid: string,
  ): Promise<Document<ArangoMachine> | null> {
    const res = await machines.find({ uuid });
    return res.length > 0 ? res[0] : null;
  }
}
