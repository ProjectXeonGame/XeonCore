import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import { bcrypt } from "../bcrypt.ts";
import { Document } from "https://deno.land/x/darango/mod.ts";
import db from "../database.ts";
import Machine from "./machine.ts";
import * as path from "https://deno.land/std@0.95.0/path/mod.ts";

const users = await db.collection<ArangoUser>("users");

export interface ArangoUser {
  uuid: string;
  username: string;
  hash: string;
  last_login: number;
  is_online: boolean;
  machine_id: string;
}

export default class User {
  static async new(
    username: string,
    password: string,
  ): Promise<Document<ArangoUser>> {
    return await users.create({
      uuid: v4.generate(),
      username,
      hash: await bcrypt.hash(password, await bcrypt.genSalt()),
      last_login: Date.now(),
      is_online: false,
      machine_id: "",
    });
  }
  static async findUser(
    filter: { username: string } | { uuid: string },
  ): Promise<Document<ArangoUser> | null> {
    const res = await users.find(filter);
    return res.length > 0 ? res[0] : null;
  }
  static async authUser(
    username: string,
    password: string,
  ): Promise<Document<ArangoUser>> {
    const user = await User.findUser({ username });
    if (user != null) {
      if (await bcrypt.compare(password, user.hash as string)) {
        return user;
      }
    }
    throw new Error("Unable to authenticate user.");
  }
  static async runCommand(
    command: string,
    user: Document<ArangoUser>,
  ): Promise<void> {
    const machine = await Machine.findMachine(user.machine_id as string);
    if (machine != null) {
      const cmd = command.trim().split(" ");
      const app = cmd.shift();
      if (app != undefined) {
        const bin_path = path.isAbsolute(app)
          ? app
          : path.resolve("/usr/bin/", app);
        const fs = JSON.parse(machine.filesystem as string);
        if (fs[bin_path] != null) {
          //
        }
      }
    }
  }
}
