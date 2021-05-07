import { WSClient } from "../../network/socket.ts";
import User from "../../models/users.ts";
import Machine from "../../models/machine.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const authenticate: PacketHandler = {
  name: "AUTHENTICATE",
  handler: async function (
    client: WSClient,
    packet: { [key: string]: any },
    ttyManager: TTYList,
  ): Promise<void> {
    if (client.uid != null) throw new Error("Already authenticated.");
    const username = packet.username as string;
    const password = packet.password as string;
    const user = await User.authUser(username, password);
    const machine = await Machine.findMachine(user.machine_id as string);
    if (machine == null) {
      await client.send("Machine not found. Rebuilding...");
      const nmachine = await Machine.new();
      user.machine_id = nmachine.uuid as string;
      await user.update();
      await client.send("Machine rebuilt.");
    }
    client.uid = user.uuid as string;
    client.mid = user.machine_id as string;
    user.is_online = true;
    user.last_login = Date.now();
    await user.update();
    await client.send("Authenticated successfully. Welcome!");
    await client.send("Connecting to terminal instance...");
    client.tty = ttyManager.create(user.machine_id as string);
    client.tty.on("stdout", (data) => {
      client.send(data);
    });
    client.tty.on("stderr", (data) => {
      client.send(data);
    });
    await client.send(`Welcome, ${user.username}.`);
  },
};

export default authenticate;
