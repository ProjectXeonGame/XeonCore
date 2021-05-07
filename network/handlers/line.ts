import { WSClient } from "../../network/socket.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const line: PacketHandler = {
  name: "LINE",
  handler: async function (
    client: WSClient,
    packet: { [key: string]: any },
    ttyManager: TTYList,
  ): Promise<void> {
    if (
      client.uid != null && client.mid != null && client.tty != null
    ) {
      await client.tty.stdin({
        machine: client.mid,
        caller: client.uid,
      }, packet.data as string);
    }
  },
};

export default line;
