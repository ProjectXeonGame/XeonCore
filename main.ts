// deno-lint-ignore-file require-await
import config from "./config.ts";
import { WServer } from "./network/socket.ts";
import db from "./database.ts";
import User from "./models/users.ts";
import TTYList from "./tty.ts";
import handlers from "./network/handlers/mod.ts";

if (db) console.log("Loaded DB");

const ttyManager = new TTYList();

const _server = new WServer(
  config.WEBSOCKET_HOST,
  config.WEBSOCKET_PORT,
  config.WEBSOCKET_SSL_CERT,
  config.WEBSOCKET_SSL_KEY,
);

_server.on("connect", async (socket, context) => {
  await socket.send("Please authenticate.");
});

_server.on("message", async (socket, context, ev) => {
  try {
    const packet: { [key: string]: any } = JSON.parse(ev);
    ev = JSON.stringify(packet, (k, v) => {
      if (k == "password") return "*".repeat(10);
      else return v;
    }, 2);
    console.log(context.uuid, ev);
    if (packet.event != undefined) {
      const handler = handlers[packet.event as string];
      if (handler != undefined) {
        await handler(socket, context, packet, ttyManager);
      }
    }
  } catch (_e) {
    console.error(_e);
    await socket.send(_e.toString());
  }
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

_server.on("error", console.error);
