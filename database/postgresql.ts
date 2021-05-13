import config from "../config.ts";
import { PostgresConnector } from "https://deno.land/x/denodb/mod.ts";

const connector = new PostgresConnector({
  host: config.POSTGRESQL_HOST || "localhost",
  port: config.POSTGRESQL_PORT || 5432,
  username: config.POSTGRESQL_USER || "xeon",
  password: config.POSTGRESQL_PASS || "xeon",
  database: config.POSTGRESQL_DB || "project_xeon",
});

export default connector;
