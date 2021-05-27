import config from "./config.ts";
import { Arango } from "https://deno.land/x/darango/mod.ts";
import { ArangoMachine, ArangoUser } from "./models/mod.ts";

const db = await Arango.basicAuth({
  uri: config.ARANGO_URI,
  username: config.ARANGO_USER,
  password: config.ARANGO_PASSWORD,
});

/* Collections */
export const users = await db.collection<ArangoUser>("users");
export const machines = await db.collection<ArangoMachine>("machines");

export const query = db.query;

console.log("Database loaded.");
