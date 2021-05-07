import { WSClient } from "../../network/socket.ts";
import User from "../../models/users.ts";
import Machine from "../../models/machine.ts";
import TTYList from "../../tty.ts";
import { PacketHandler } from "./mod.ts";

const register: PacketHandler = {
  name: "REGISTER",
  handler: async function (
    client: WSClient,
    packet: { [key: string]: any },
    _ttyManager: TTYList,
  ): Promise<void> {
    if (client.uid != null) throw new Error("Already authenticated.");
    const username = packet.username as string;
    const password = packet.password as string;
    if (await User.findUser({ username }) != null) {
      throw new Error("Unable to register.");
    }
    const user = await User.new(username, password);
    await client.send("Setting up machine...");
    const machine = await Machine.new();
    user.machine_id = machine.uuid as string;
    await user.update();
    await client.send(
      "Registration complete. Please authenticate using your new credentials.",
    );
  },
};

export default register;
