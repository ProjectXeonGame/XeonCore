import { TTYApplication } from "../tty.ts";
import Machine from "../models/machine.ts";
import MockFS from "../fs.ts";

const software: { [key: string]: TTYApplication } = {};

software.echo = async (ctx, argv): Promise<number> => {
  ctx.tty.stdout(argv.join(" "));
  return 0;
};

software.ls = async (ctx, argv): Promise<number> => {
  const fs = await ctx.tty.getFilesystem();
  const res = await fs.readDir(argv.join(" "));
  ctx.tty.stdout(res.join("\n"));
  return 0;
};

export default software;
