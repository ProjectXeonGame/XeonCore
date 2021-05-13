import { WebSocket } from "https://deno.land/std@0.95.0/ws/mod.ts";
import { WSContext } from "../../network/socket.ts";
import User from "../../models/users.ts";
import Machine from "../../models/machine.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const register: PacketHandler = {
  name: "REGISTER",
  handler: async function (
    socket: WebSocket,
    context: WSContext,
    packet: { [key: string]: any },
    _ttyManager: TTYList,
  ): Promise<void> {
    if (context.uid != null) throw new Error("Already authenticated.");
    const username = packet.username as string;
    const password = packet.password as string;
    if (await User.findUser({ username }) != null) {
      throw new Error("Unable to register.");
    }
    await User.new(username, password);
    await socket.send(
      "Registration complete. Please authenticate using your new credentials.",
    );
  },
};

export default register;
