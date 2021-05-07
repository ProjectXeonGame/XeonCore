import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import { TTYCtx } from "../tty.ts";

const defaultFS = JSON.stringify({
  "/": null,
  "/home": null,
  "/usr": null,
  "/usr/bin": null,
  "/usr/bin/echo": (async (ctx: TTYCtx, argv: string[]): Promise<number> => {
    ctx.tty.stdout(argv.join(" "));
    return 0;
  }).toString(),
});

export default class Machine extends Model {
  static table = "machines";
  static fields = {
    _id: {
      primaryKey: true,
    },
    uuid: DataTypes.STRING,
    filesystem: DataTypes.JSON,
  };
  static async new(): Promise<Machine> {
    return await Machine.create({
      uuid: v4.generate(),
      filesystem: defaultFS,
    });
  }
  static async findMachine(uuid: string): Promise<Machine | null> {
    return (await Machine.where({ uuid }).all())[0] || null;
  }
}
