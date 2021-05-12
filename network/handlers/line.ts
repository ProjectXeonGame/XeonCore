import { WebSocket } from "https://deno.land/std@0.95.0/ws/mod.ts";
import { WSContext } from "../../network/socket.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const line: PacketHandler = {
  name: "LINE",
  handler: async function (
    socket: WebSocket,
    context: WSContext,
    packet: { [key: string]: any },
    ttyManager: TTYList,
  ): Promise<void> {
    if (
      context.uid != null && context.mid != null && context.tty != null
    ) {
      await context.tty.stdin({
        machine: context.mid,
        caller: context.uid,
      }, packet.data as string);
    }
  },
};

export default line;
