// deno-lint-ignore-file require-await
import config from "./config.ts";
import { WServer } from "./network/socket.ts";
import initDB from "./database.ts";
import User from "./models/users.ts";
import TTYList from "./tty.ts";
import handlers from "./network/handlers/mod.ts";
import * as http from "./network/http.ts";

console.log(handlers);

await initDB();

const ttyManager = new TTYList();

const _server = new WServer(
  config.WEBSOCKET_HOST,
  config.WEBSOCKET_PORT,
  config.WEBSOCKET_SSL_CERT,
  config.WEBSOCKET_SSL_KEY,
);

_server.on("connect", async (client) => {
  await client.send(
    "Please authenticate.\nRegister: /register <username>\nLogin: /auth <username>",
  );
  client.on("message", async (ev) => {
    try {
      const packet: { [key: string]: any } = JSON.parse(ev);
      ev = JSON.stringify(packet, (k, v) => {
        if (k == "password") return "*".repeat(10);
        else return v;
      }, 2);
      console.log(client.uuid, ev);
      if (packet.event != undefined) {
        const handler = handlers[packet.event as string];
        if (handler != undefined) {
          await handler(client, packet, ttyManager);
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

const httpPromise = http.listen();
