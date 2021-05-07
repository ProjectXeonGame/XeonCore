// deno-lint-ignore-file require-await
import config from "./config.ts";
import { WServer } from "./socket.ts";
import initDB from "./database.ts";
import User from "./models/users.ts";
import Machine from "./models/machine.ts";
import TTYList from "./tty.ts";

await initDB();

const ttyManager = new TTYList();

const _server = new WServer(config.WEBSOCKET_HOST, config.WEBSOCKET_PORT);

_server.on("connect", async (client) => {
  client.on("message", async (ev) => {
    try {
      const packet: { [key: string]: any } = JSON.parse(ev);
      ev = JSON.stringify(packet, (k, v) => {
        if (k == "password") return "*".repeat(10);
        else return v;
      }, 2);
      console.log(client.uuid, ev);
      if (packet.event != undefined) {
        switch (packet.event as string) {
          case "LINE":
            {
              if (
                client.uid != null && client.mid != null && client.tty != null
              ) {
                await client.tty.stdin({
                  machine: client.mid,
                  caller: client.uid,
                }, packet.data as string);
              }
            }
            break;
          case "REGISTER":
            {
              if (client.uid != null) throw new Error("Already authenticated.");
              const username = packet.username as string;
              const password = packet.password as string;
              if (await User.findUser({ username }) != null) {
                throw new Error("Unable to register.");
              }
              const user = await User.new(username, password);
              client.uid = user.uuid as string;
              user.is_online = true;
              user.last_login = Date.now();
              await client.send("Registration complete. Welcome!");
              await client.send("Setting up machine...");
              const machine = await Machine.new();
              user.machine_id = machine.uuid as string;
              await user.update();
              client.mid = machine.uuid as string;
              await client.send("Connecting to terminal instance...");
              client.tty = ttyManager.create(machine.uuid as string);
              client.tty.on("stdout", (data) => {
                client.send(data);
              });
              client.tty.on("stderr", (data) => {
                client.send(data);
              });
              await client.send(`Welcome, ${user.username}.`);
            }
            break;
          case "AUTHENTICATE":
            {
              if (client.uid != null) throw new Error("Already authenticated.");
              const username = packet.username as string;
              const password = packet.password as string;
              const user = await User.authUser(username, password);
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
            }
            break;
          default:
            break;
        }
      }
    } catch (_e) {
      console.error(_e);
      await client.send(_e.toString());
    }
  });
});

_server.on("disconnect", async (client) => {
  if (client.uid != null) {
    // Cleanup DB
    const user = await User.findUser({ uuid: client.uid });
    if (user != null) {
      user.is_online = false;
      await user.update();
    }
    client.uid = null;
    if (client.tty != null) {
      client.tty.end();
      client.tty = null;
    }
  }
});
