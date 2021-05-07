import { WSClient } from "../../network/socket.ts";
import TTYList from "../../tty.ts";

export type PacketFunction = (
  client: WSClient,
  packet: { [key: string]: any },
  ttyManager: TTYList,
) => Promise<void>;

export interface PacketHandler {
  name: string;
  handler: PacketFunction;
}

export type PacketHandlers = { [key: string]: PacketFunction };

const handlers: PacketHandlers = {};

for await (const entry of Deno.readDir("./network/handlers")) {
  if (entry.isFile && entry.name != "mod.ts") {
    console.log("Loading handler:", entry.name);
    const handler: PacketHandler = (await import(`./${entry.name}`)).default;
    handlers[handler.name] = handler.handler;
  }
}

export default handlers;
