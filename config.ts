import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";

const conf = config({ safe: true, allowEmptyValues: true });

// env Variables
Deno.env.set("DENO_ENV", conf.DENO_ENV || "production");

type ConnectorType = "postgresql";

export interface XeonConfig {
  DATABASE_CONNECTOR: ConnectorType;
  POSTGRESQL_HOST?: string;
  POSTGRESQL_PORT?: number;
  POSTGRESQL_USER?: string;
  POSTGRESQL_PASS?: string;
  POSTGRESQL_DB?: string;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  WEBSOCKET_SSL_KEY?: string;
  WEBSOCKET_SSL_CERT?: string;
  HTTP_HOST: string;
  HTTP_PORT: number;
}

const _config: XeonConfig = {
  POSTGRESQL_DB: conf.POSTGRESQL_DB,
  POSTGRESQL_HOST: conf.POSTGRESQL_HOST,
  POSTGRESQL_PASS: conf.POSTGRESQL_PASS,
  POSTGRESQL_PORT: Number(conf.POSTGRESQL_PORT),
  POSTGRESQL_USER: conf.POSTGRESQL_USER,
  DATABASE_CONNECTOR: conf.DATABASE_CONNECTOR as ConnectorType,
  WEBSOCKET_HOST: conf.WEBSOCKET_HOST,
  WEBSOCKET_PORT: Number(conf.WEBSOCKET_PORT),
  WEBSOCKET_SSL_CERT: conf.WEBSOCKET_SSL_CERT,
  WEBSOCKET_SSL_KEY: conf.WEBSOCKET_SSL_KEY,
  HTTP_HOST: conf.HTTP_HOST,
  HTTP_PORT: Number(conf.HTTP_PORT),
};

export default _config;
