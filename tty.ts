import { EventEmitter } from "https://deno.land/x/deno_events@0.1.1/mod.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import MockFS from "./fs.ts";
import software from "./software/mod.ts";

interface TTYEvents {
  close(): Promise<void>;
  stdout(data: string): Promise<void>;
  stdin(data: string): Promise<void>;
  stderr(data: string): Promise<void>;
  cwd(newCWD: string): Promise<void>;
}

export type TTYApplication = (ctx: TTYCtx, argv: string[]) => Promise<number>;

export interface Ctx {
  machine: string;
  caller: string;
}

export interface TTYCtx extends Ctx {
  tty: TTY;
}

export function splitCommandsByPipe(cmd: string): string[] {
  return cmd.split(" | ");
}

export function splitCommandsByMult(cmd: string): string[] {
  return cmd.split(" && ");
}

export function getPipeToFile(
  cmd: string,
): { command: string; file: string } | null {
  let t = cmd.split(" > ");
  if (t.length > 1) {
    t = t.map((v) => v.trim());
    return {
      command: t[0],
      file: t[1],
    };
  }
  return null;
}

export class TTY extends EventEmitter<TTYEvents> {
  public readonly uuid: string = v4.generate();
  public runningApp: boolean;
  private stdoutCatcher: ((data: string) => void)[] = [];
  private stdoutBuffer: string = "";
  private cwd: string = "/";
  public env: { [key: string]: string } = {
    UUID: this.uuid,
  };
  constructor(public readonly machineID: string) {
    super();
    Object.defineProperty(this.env, "CWD", {
      get: () => {
        return this.cwd;
      },
      set: (v: string) => {
        this.cwd = v;
        this.emit("cwd", v);
      },
    });
    this.env.HWID = this.machineID;
    this.runningApp = false;
  }
  public stdout(data: string) {
    if (this.stdoutCatcher.length > 0) this.stdoutBuffer += data;
    else this.emit("stdout", data);
  }
  public async getFilesystem(): Promise<MockFS> {
    return await MockFS.getFilesystem(this.machineID);
  }
  private immediateStdinCatch(
    ctx: Ctx,
    data: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const idx = this.stdoutCatcher.push((data) => {
        resolve(data);
      }) - 1;
      setTimeout(() => {
        this.stdin(ctx, data).catch((e) => {
          this.stdoutCatcher.splice(idx, 1);
          reject(e);
        });
      }, 1);
    });
  }
  private immediateStdin(
    ctx: Ctx,
    data: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.stdin(ctx, data).then(resolve).catch(reject);
      }, 1);
    });
  }
  public async stdin(ctx: Ctx, data: string): Promise<void> {
    const cmds = splitCommandsByMult(data);
    if (cmds.length > 1) {
      for (const command of cmds) {
        try {
          await this.immediateStdin(ctx, command);
        } catch (e) {
          this.emit("stderr", e.toString());
          break;
        }
      }
    } else {
      const pipes = splitCommandsByPipe(cmds[0]);
      if (pipes.length > 1) {
        try {
          let next = "";
          for (const pipe of pipes) {
            next = await this.immediateStdinCatch(
              ctx,
              [...pipe.split(" "), ...next.split(" ")].map((v) => v.trim())
                .join(
                  " ",
                ),
            );
          }
          this.stdout(next);
        } catch (e) {
          this.emit("stderr", e.toString());
        }
      } else {
        const pipefile = getPipeToFile(pipes[0]);
        if (pipefile != null) {
          const out = await this.immediateStdinCatch(ctx, pipefile.command);
          const fs = await this.getFilesystem();
          await fs.appendFile(pipefile.file, out, this.env.CWD);
        } else {
          const tctx: TTYCtx = Object.assign(ctx, { tty: this });
          const comd = pipes[0].trim().split(" ");
          const com = comd.shift();
          if (com != undefined) {
            const exitCode = await this.run(tctx, com, comd);
            if (exitCode != 0) {
              throw new Error(`Process exited with code ${exitCode}`);
            }
          }
        }
      }
    }
  }
  private async run(
    ctx: TTYCtx,
    command: string,
    argv: string[],
  ): Promise<number> {
    try {
      let fn: TTYApplication;
      if (software[command] == undefined) {
        throw new Error(`Invalid command '${command}'.`);
      }
      fn = software[command];
      this.runningApp = true;
      const code = await fn(
        ctx,
        argv.map((v) => {
          let t = v;
          for (const key of Object.keys(this.env)) {
            const reg = new RegExp(`\\$${key}`, "ig");
            t = t.replace(reg, this.env[key]);
          }
          return t;
        }),
      );
      this.runningApp = false;
      if (this.stdoutCatcher.length > 0) {
        const catcher = this.stdoutCatcher.pop();
        if (catcher != undefined) catcher(this.stdoutBuffer);
        this.stdoutBuffer = "";
      }
      return code;
    } catch (e) {
      this.emit("stderr", e.toString());
      this.runningApp = false;
      return 1;
    }
  }
  end() {
    this.emit("close");
  }
}

export default class TTYList {
  public terminals: { [key: string]: TTY[] } = {};
  ensure(mid: string) {
    if (this.terminals[mid] == undefined) this.terminals[mid] = [];
  }
  public create(mid: string): TTY {
    this.ensure(mid);
    const list = this.terminals[mid];
    const tty = new TTY(mid);
    if (list != undefined) {
      list.push(tty);
      tty.on("close", () => {
        const idx = list?.findIndex((v) => v.uuid == tty.uuid) || -1;
        if (idx != -1) {
          list?.splice(idx, 1);
        }
      });
      return tty;
    } else {
      throw new Error("Unable to get list for machine.");
    }
  }
  public find(mid: string, tid: string): TTY | undefined {
    return this.terminals[mid]?.find((v) => v.uuid == tid);
  }
  public close(mid: string, tid: string) {
    this.find(mid, tid)?.end();
  }
}
