import config from "./config.ts";
import {
  Database,
  MongoDBConnector,
  SQLite3Connector,
} from "https://deno.land/x/denodb/mod.ts";

import models from "./models/mod.ts";

const connector = config.DATABASE_CONNECTOR == "mongodb"
  ? new MongoDBConnector({
    uri: config.MONGODB_URI,
    database: "project_xeon",
  })
  : new SQLite3Connector({ filepath: config.SQLITE_FILEPATH });

const db = new Database({ connector });

export default async function () {
  await db.link(models);
  await db.sync();
}
