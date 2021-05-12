import { serve } from "https://deno.land/std@0.95.0/http/server.ts";
import { v4 } from "https://deno.land/std@0.95.0/uuid/mod.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  isWebSocketPongEvent,
  WebSocket,
} from "https://deno.land/std@0.95.0/ws/mod.ts";

import { TTY } from "../tty.ts";

import { EventEmitter as EE } from "https://deno.land/x/deno_events@0.1.1/mod.ts";

interface WSClientEvents {
  message(this: WSClient, ev: string): Promise<void>;
  binary(this: WSClient, ev: Uint8Array): Promise<void>;
  ping(this: WSClient, ev?: Uint8Array): Promise<void>;
  pong(this: WSClient, ev?: Uint8Array): Promise<void>;
  error(this: WSClient, err: Error): Promise<void>;
  close(this: WSClient, code: number, reason?: string): Promise<void>;
}

export class WSClient extends EE<WSClientEvents> {
  public readonly promise: Promise<void>;
  public readonly uuid: string = v4.generate();
  public uid: string | null;
  public mid: string | null;
  public tty: TTY | null;
  constructor(
    private readonly _sock: WebSocket,
  ) {
    super();
    this.mid = null;
    this.uid = null;
    this.tty = null;
    this.promise = this.handle();
  }
  public async send(message: Uint8Array | string) {
    await this._sock.send(message);
  }
  public async ping(body?: Uint8Array) {
    await this._sock.ping(body);
  }
  public async close(code?: number, reason?: string) {
    code = code || 1000;
    if (reason != undefined) {
      await this._sock.close(code, reason);
    } else {
      await this._sock.close(code);
    }
  }
  private async handle() {
    try {
      for await (const ev of this._sock) {
        if (this._sock.isClosed) break;
        if (typeof ev == "string") {
          this.emit("message", ev);
        } else if (ev instanceof Uint8Array) {
          this.emit("binary", ev);
        } else if (isWebSocketPingEvent(ev)) {
          const [, body] = ev;
          this.emit("ping", body);
        } else if (isWebSocketPongEvent(ev)) {
          const [, body] = ev;
          this.emit("pong", body);
        } else if (isWebSocketCloseEvent(ev)) {
          const { code, reason } = ev;
          this.emit("close", code, reason);
        } else {
          throw new Error("Invalid WebSocketEvent type.");
        }
      }
    } catch (_err) {
      this.emit("error", _err);
      if (!this._sock.isClosed) {
        await this.close(1005).catch(console.error);
      }
    }
  }
}

interface WServerEvents {
  connect(client: WSClient): Promise<void>;
  disconnect(client: WSClient): Promise<void>;
  error(err: Error): Promise<void>;
}

export class WServer extends EE<WServerEvents> {
  public readonly promise: Promise<void>;
  private clients: Map<string, WSClient> = new Map();
  constructor(
    public readonly host: string,
    public readonly port: number,
  ) {
    super();
    this.promise = this.handle();
  }
  private async handle() {
    console.log(`Listening on ${this.host}:${this.port}...`);
    try {
      for await (const req of serve(`${this.host}:${this.port}`)) {
        const { conn, r: bufReader, w: bufWriter, headers } = req;
        try {
          // declaration
          let sock: WebSocket | null = null;
          let client: WSClient | null = null;

          // accept ws connection
          sock = await acceptWebSocket({
            conn,
            bufReader,
            bufWriter,
            headers,
          });

          // create client object and map to uuid
          client = new WSClient(sock);
          this.clients.set(client.uuid, client);

          console.log(`Client ${client.uuid} connected.`);

          if (client != null) this.emit("connect", client);

          // Wait on client to close
          await client.promise;

          console.log(`Client ${client.uuid} disconnected.`);

          if (client != null) this.emit("disconnect", client);

          // cleanup
          this.clients.delete(client.uuid);
          client = null;
          sock = null;
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
