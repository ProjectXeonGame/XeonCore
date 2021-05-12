import * as path from "https://deno.land/std@0.95.0/path/mod.ts";
import { Router } from "https://deno.land/x/oak@v7.4.0/mod.ts";
const api = new Router();

type APIRouterInit = () => Router;

let isLoaded: boolean = false;

export default async function (): Promise<Router> {
  if (isLoaded) return new Router().use("/api", api.routes());
  for await (const el of Deno.readDir("./network/api")) {
    if (el.isFile && el.name != "mod.ts") {
      const fn: APIRouterInit = (await import(`./${el.name}`)).default;
      const endpoint = fn();
      api.use("/v1", endpoint.routes());
    }
  }
  return new Router().use("/api", api.routes());
}
