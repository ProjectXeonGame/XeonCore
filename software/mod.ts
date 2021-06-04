import { TTYApplication } from "../tty.ts";

const software: { [key: string]: TTYApplication } = {};

software.echo = async function (ctx, argv): Promise<number> {
  ctx.tty.stdout(
    argv.join(" ").replace(/\\n/g, "\n").replace(/\\x1b/g, "\x1b"),
  );
  return 0;
};

software.ls = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    const res = await fs.readDir(argv[0] || ".", ctx.tty.env.CWD);
    ctx.tty.stdout(res.join("\n"));
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.mkdir = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    await fs.mkdir(argv[0], ctx.tty.env.CWD);
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.rmdir = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    await fs.rmdir(argv[0], ctx.tty.env.CWD);
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.rm = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    await fs.rm(argv[0], false, ctx.tty.env.CWD);
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.rmp = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    await fs.rm(argv[0], true, ctx.tty.env.CWD);
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.mkdirp = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    await fs.mkdirp(argv[0], ctx.tty.env.CWD);
    return 0;
  } catch (e) {
    ctx.tty.emit("stderr", e.toString());
    return 1;
  }
};

software.cat = async function (ctx, argv): Promise<number> {
  try {
    const fs = await ctx.tty.getFilesystem();
    ctx.tty.stdout(await fs.readFile(argv[0], ctx.tty.env.CWD));
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
