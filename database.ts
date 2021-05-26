import config from "./config.ts";
import { Arango } from "https://deno.land/x/darango/mod.ts";

const db = await Arango.basicAuth({
  uri: config.ARANGO_URI,
  username: config.ARANGO_USER,
  password: config.ARANGO_PASSWORD,
});

export default db;
