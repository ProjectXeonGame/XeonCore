import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import { bcrypt } from "../bcrypt.ts";
import Machine from "./machine.ts";
import * as path from "https://deno.land/std@0.95.0/path/mod.ts";

export default class User extends Model {
  static table = "users";
  static fields = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: DataTypes.STRING,
    username: DataTypes.STRING,
    hash: DataTypes.STRING,
    last_login: DataTypes.STRING,
    is_online: DataTypes.BOOLEAN,
    machine_id: DataTypes.STRING,
  };
  static async new(
    username: string,
    password: string,
  ): Promise<User> {
    return await User.create({
      uuid: v4.generate(),
      username,
      hash: await bcrypt.hash(password, await bcrypt.genSalt()),
      last_login: Date.now().toString(),
      is_online: false,
      machine_id: "",
    });
  }
  static async findUser(
    filter: { username: string } | { uuid: string },
  ): Promise<User | null> {
    return (await User.where(filter).all())[0] || null;
  }
  static async authUser(username: string, password: string): Promise<User> {
    const user = await User.findUser({ username });
    if (user != null) {
      if (await bcrypt.compare(password, user.hash as string)) {
        return user;
      }
    }
    throw new Error("Unable to authenticate user.");
  }
  static async runCommand(command: string, user: User): Promise<void> {
    const machine = await Machine.findMachine(user.machine_id as string);
    if (machine != null) {
      const cmd = command.trim().split(" ");
      const app = cmd.shift();
      if (app != undefined) {
        const bin_path = path.isAbsolute(app)
          ? app
          : path.resolve("/usr/bin/", app);
        const fs = JSON.parse(machine.file_system as string);
        if (fs[bin_path] != null) {
          //
        }
      }
    }
  }
}
