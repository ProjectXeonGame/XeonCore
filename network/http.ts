import config from "../config.ts";
import * as path from "https://deno.land/std@0.95.0/path/mod.ts";
import { Application, send } from "https://deno.land/x/oak@v7.4.0/mod.ts";

const controller = new AbortController();
const { signal } = controller;

const app = new Application();

app.use(async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: path.resolve(Deno.cwd(), "public"),
    index: "index.html",
  });
});

export async function listen() {
  return await app.listen({
    port: config.HTTP_PORT,
    hostname: config.HTTP_HOST,
    signal,
  });
}

export const abortController = controller;
