import config from "./config.ts";
import {
  Database,
  MongoDBConnector,
  PostgresConnector,
} from "https://deno.land/x/denodb/mod.ts";

import models from "./models/mod.ts";

const connector = config.DATABASE_CONNECTOR == "mongodb"
  ? new MongoDBConnector({
    uri: config.MONGODB_URI,
    database: "project_xeon",
  })
  : new PostgresConnector({
    host: config.POSTGRESQL_HOST,
    port: config.POSTGRESQL_PORT,
    username: config.POSTGRESQL_USER,
    password: config.POSTGRESQL_PASS,
    database: config.POSTGRESQL_DB,
  });

const db = new Database({ connector });

export default async function () {
  await db.link(models);
  await db.sync();
}
