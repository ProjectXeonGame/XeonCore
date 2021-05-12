import config from "../config.ts";
import * as path from "https://deno.land/std@0.95.0/path/mod.ts";
import {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v7.4.0/mod.ts";
import apiLoad from "./api/mod.ts";

const controller = new AbortController();
const { signal } = controller;

const app = new Application();

export async function listen() {
  const api = await apiLoad();
  app.use(api.routes());
  return await app.listen({
    port: config.HTTP_PORT,
    hostname: config.HTTP_HOST,
    signal,
  });
}

export const abortController = controller;
