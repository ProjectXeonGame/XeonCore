import { WebSocket } from "https://deno.land/std@0.95.0/ws/mod.ts";
import { WSContext } from "../../network/socket.ts";
import User from "../../models/users.ts";
import Machine from "../../models/machine.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const authenticate: PacketHandler = {
  name: "AUTHENTICATE",
  handler: async function (
    socket: WebSocket,
    context: WSContext,
    packet: { [key: string]: any },
    ttyManager: TTYList,
  ): Promise<void> {
    if (context.uid != null) throw new Error("Already authenticated.");
    const username = packet.username as string;
    const password = packet.password as string;
    const user = await User.authUser(username, password);
    const machine = await Machine.findMachine(user.machine_id as string);
    if (machine == null) {
      await socket.send("Machine not found. Rebuilding...");
      const nmachine = await Machine.new();
      user.machine_id = nmachine.uuid as string;
      await user.update();
      await socket.send("Machine rebuilt.");
    }
    context.uid = user.uuid as string;
    context.mid = user.machine_id as string;
    user.is_online = true;
    user.last_login = Date.now();
    await user.update();
    await socket.send("Authenticated successfully. Welcome!");
    await socket.send("Connecting to terminal instance...");
    context.tty = ttyManager.create(user.machine_id as string);
    context.tty.on("stdout", (data) => {
      socket.send(data);
    });
    context.tty.on("stderr", (data) => {
      socket.send(data);
    });
    await socket.send(`Welcome, ${user.username}.`);
  },
};

export default authenticate;
