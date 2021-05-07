import config from "./config.ts";
import { Database, MongoDBConnector } from "https://deno.land/x/denodb/mod.ts";

import models from "./models/mod.ts";

const connector = new MongoDBConnector({
  uri: config.MONGODB_URI,
  database: "project_xeon",
});

const db = new Database({ connector });

export default async function () {
  await db.link(models);
  await db.sync();
}
