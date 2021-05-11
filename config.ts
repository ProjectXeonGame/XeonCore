import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";

const conf = config({ safe: true });

export interface XeonConfig {
  MONGODB_URI: string;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
  HTTP_HOST: string;
  HTTP_PORT: number;
}

const _config: XeonConfig = {
  MONGODB_URI: conf.MONGODB_URI,
  WEBSOCKET_HOST: conf.WEBSOCKET_HOST,
  WEBSOCKET_PORT: Number(conf.WEBSOCKET_PORT),
  HTTP_HOST: conf.HTTP_HOST,
  HTTP_PORT: Number(conf.HTTP_PORT),
};

export default _config;
