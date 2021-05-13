import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import User from "./users.ts";

const defaultFS = JSON.stringify({
  "/": null,
  "/home": null,
  "/usr": null,
  "/usr/bin": null,
});

export default class Machine extends Model {
  static table = "machines";
  static fields = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: DataTypes.STRING,
    filesystem: DataTypes.JSON,
  };
  static async new(user_id: number): Promise<Machine> {
    return await Machine.create({
      uuid: v4.generate(),
      filesystem: defaultFS,
      user_id,
    });
  }
  static async findMachine(uuid: string): Promise<Machine | null> {
    return (await Machine.where({ uuid }).all())[0] || null;
  }
  static owner() {
    return this.hasOne(User);
  }
}
