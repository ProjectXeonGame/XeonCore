import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";

const conf = config({ safe: true, allowEmptyValues: true });

export interface XeonConfig {
  ARANGO_URI: string;
  ARANGO_USER: string;
  ARANGO_PASSWORD: string;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  WEBSOCKET_SSL_KEY?: string;
  WEBSOCKET_SSL_CERT?: string;
  HTTP_HOST: string;
  HTTP_PORT: number;
}

const _config: XeonConfig = {
  ARANGO_URI: conf.ARANGO_URI,
  ARANGO_PASSWORD: conf.ARANGO_PASSWORD,
  ARANGO_USER: conf.ARANGO_USER,
  WEBSOCKET_HOST: conf.WEBSOCKET_HOST,
  WEBSOCKET_PORT: Number(conf.WEBSOCKET_PORT),
  WEBSOCKET_SSL_CERT: conf.WEBSOCKET_SSL_CERT,
  WEBSOCKET_SSL_KEY: conf.WEBSOCKET_SSL_KEY,
  HTTP_HOST: conf.HTTP_HOST,
  HTTP_PORT: Number(conf.HTTP_PORT),
};

export default _config;
