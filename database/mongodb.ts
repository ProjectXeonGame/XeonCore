import config from "../config.ts";
import { MongoDBConnector } from "https://deno.land/x/denodb/mod.ts";

const connector = new MongoDBConnector({
  uri: config.MONGODB_URI || "mongodb://localhost:27017",
  database: "project_xeon",
});

export default connector;
