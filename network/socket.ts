import {
  serve,
  Server,
  serveTLS,
} from "https://deno.land/std@0.96.0/http/server.ts";
import { v4 } from "https://deno.land/std@0.96.0/uuid/mod.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPongEvent,
  WebSocket,
  WebSocketMessage,
} from "https://deno.land/std@0.96.0/ws/mod.ts";

import { TTY } from "../tty.ts";

import { EventEmitter as EE } from "https://deno.land/x/deno_events@0.1.1/mod.ts";

export interface WSContext {
  uuid: string;
  uid: string | null;
  mid: string | null;
  tty: TTY | null;
}

export interface WebSocketShell {
  send(message: WebSocketMessage): Promise<void>;
  close(code: number, reason?: string): Promise<void>;
}

interface WServerEvents {
  connect(socket: WebSocket, context: WSContext): Promise<void>;
  message(
    socket: WebSocket,
    context: WSContext,
    message: string,
  ): Promise<void>;
  binary(
    socket: WebSocket,
    context: WSContext,
    data: Uint8Array,
  ): Promise<void>;
  pong(socket: WebSocket, context: WSContext, body?: Uint8Array): Promise<void>;
  close(context: WSContext, code: number, reason?: string): Promise<void>;
  disconnect(context: WSContext): Promise<void>;
  error(err: Error): Promise<void>;
}

export class WServer extends EE<WServerEvents> {
  public readonly promise: Promise<void>;
  private server: Server;
  private clients: Map<string, WebSocketShell> = new Map();

  constructor(
    public readonly host: string,
    public readonly port: number,
    cert?: string,
    key?: string,
  ) {
    super();
    this.server = (cert != undefined && key != undefined)
      ? serveTLS({
        hostname: this.host,
        port: this.port,
        certFile: cert,
        keyFile: key,
      })
      : serve({ hostname: this.host, port: this.port });
    this.promise = this.handle();
  }
  private async handle() {
    console.log(`Listening on ${this.host}:${this.port}...`);
    try {
      for await (const req of this.server) {
        const { conn, r: bufReader, w: bufWriter, headers } = req;
        try {
          // declaration
          let sock: WebSocket | null = null;
          let context: WSContext = {
            uuid: v4.generate(),
            uid: null,
            mid: null,
            tty: null,
          };

          // accept ws connection
          sock = await acceptWebSocket({
            conn,
            bufReader,
            bufWriter,
            headers,
          });

          const shell: WebSocketShell = {
            send: async (message) => {
              await sock?.send(message);
            },
            async close(code, reason) {
              if (reason != undefined) {
                await sock?.close(code, reason);
              } else {
                await sock?.close(code);
              }
            },
          };

          this.clients.set(context.uuid, shell);

          sock.ping();

          console.log(`Client ${context.uuid} connected.`);

          this.emit("connect", sock, context);

          const _clientPromise = new Promise(async (resolve, reject) => {
            if (sock == null) reject();
            else {
              try {
                for await (const ev of sock) {
                  if (sock.isClosed) break;
                  if (typeof ev == "string") {
                    this.emit("message", sock, context, ev);
                  } else if (ev instanceof Uint8Array) {
                    this.emit("binary", sock, context, ev);
                  } else if (isWebSocketPongEvent(ev)) {
                    const [, body] = ev;
                    this.emit("pong", sock, context, body);
                  } else if (isWebSocketCloseEvent(ev)) {
                    const { code, reason } = ev;
                    this.emit("close", context, code, reason);
                  } else {
                    throw new Error("Invalid WebSocketEvent type.");
                  }
                }
              } catch (_err) {
                this.emit("error", _err);
              }

              console.log(`Client ${context.uuid} disconnected.`);

              this.emit("disconnect", context);

              // cleanup
              this.clients.delete(context.uuid);
              sock = null;
            }
          });
        } catch (err) {
          console.error(`Failed to accept WebSocket: ${err}`);
          this.emit("error", err);
          await req.respond({ status: 400 });
        }
      }
    } catch (err) {
      console.error("Error with HTTP request:", err);
    }
  }
}
