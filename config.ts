import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";

const conf = config({ safe: true });

export interface XeonConfig {
  MONGODB_URI: string;
  WEBSOCKET_HOST: string;
  WEBSOCKET_PORT: number;
}

const _config: XeonConfig = {
  MONGODB_URI: conf.MONGODB_URI,
  WEBSOCKET_HOST: conf.WEBSOCKET_HOST,
  WEBSOCKET_PORT: Number(conf.WEBSOCKET_PORT),
};

export default _config;
