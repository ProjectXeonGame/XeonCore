import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";

const conf = config({ safe: true, allowEmptyValues: true });

export interface XeonConfig {
  DATABASE_CONNECTOR: "mongodb" | "sqlite3";
  SQLITE_FILEPATH: string;
  MONGODB_URI: string;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  WEBSOCKET_SSL_KEY?: string;
  WEBSOCKET_SSL_CERT?: string;
  HTTP_HOST: string;
  HTTP_PORT: number;
}

const _config: XeonConfig = {
  SQLITE_FILEPATH: conf.SQLITE_FILEPATH,
  DATABASE_CONNECTOR: conf.DATABASE_CONNECTOR as "mongodb" | "sqlite3",
  MONGODB_URI: conf.MONGODB_URI,
  WEBSOCKET_HOST: conf.WEBSOCKET_HOST,
  WEBSOCKET_PORT: Number(conf.WEBSOCKET_PORT),
  WEBSOCKET_SSL_CERT: conf.WEBSOCKET_SSL_CERT,
  WEBSOCKET_SSL_KEY: conf.WEBSOCKET_SSL_KEY,
  HTTP_HOST: conf.HTTP_HOST,
  HTTP_PORT: Number(conf.HTTP_PORT),
};

export default _config;
