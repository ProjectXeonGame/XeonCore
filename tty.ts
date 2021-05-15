import { EventEmitter } from "https://deno.land/x/deno_events@0.1.1/mod.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import MockFS from "./fs.ts";
import software from "./software/mod.ts";

interface TTYEvents {
  close(): Promise<void>;
  stdout(data: string): Promise<void>;
  stdin(data: string): Promise<void>;
  stderr(data: string): Promise<void>;
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

export class TTY extends EventEmitter<TTYEvents> {
  public readonly uuid: string = v4.generate();
  public runningApp: boolean;
  private stdoutCatcher: ((data: string) => void)[] = [];
  private stdoutBuffer: string = "";
  constructor(public readonly machineID: string) {
    super();
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
      this.stdoutCatcher.push((data) => {
        resolve(data);
      });
      setTimeout(() => {
        this.stdin(ctx, data);
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
        await this.immediateStdin(ctx, command);
      }
    } else {
      const pipes = splitCommandsByPipe(cmds[0]);
      if (pipes.length > 1) {
        let next = "";
        for (const pipe of pipes) {
          next = await this.immediateStdinCatch(
            ctx,
            [...pipe.split(" "), ...next.split(" ")].map((v) => v.trim()).join(
              " ",
            ),
          );
        }
        this.stdout(next);
      } else {
        const tctx: TTYCtx = Object.assign(ctx, { tty: this });
        const comd = pipes[0].trim().split(" ");
        const com = comd.shift();
        if (com != undefined) {
          try {
            await this.run(tctx, com, comd);
          } catch (_e) {
            //
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
      const commandPath = `/usr/bin/${command}`;
      const fs = await MockFS.getFilesystem(ctx.machine);
      let fn: TTYApplication;
      if (!(await fs.isFile(commandPath))) {
        if (software[command] == undefined) {
          throw new Error(`Invalid command '${command}'.`);
        }
        fn = software[command];
      } else {
        const fn_src = await fs.readFile(commandPath);
        fn = (new Function(`return ${fn_src}`))();
      }
      this.runningApp = true;
      const code = await fn(ctx, argv);
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
      return -1;
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
