import { TTYApplication } from "../tty.ts";
import * as path from "https://deno.land/std@0.95.0/path/posix.ts";

const software: { [key: string]: TTYApplication } = {};

software.echo = async function (ctx, argv): Promise<number> {
  ctx.tty.stdout(argv.join(" ").replace(/\\n/g, "\n"));
  return 0;
};

software.ls = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    const res = await fs.readDir(argv.join(" "), ctx.tty.env.CWD);
    ctx.tty.stdout(res.join("\n"));
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.cd = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    const stat = await fs.stat(argv[0], ctx.tty.env.CWD);
    if (!stat.isDirectory) throw new Error("Path is not a directory.");
    ctx.tty.env.CWD = stat.fullPath;
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

export default software;
