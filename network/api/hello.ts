import { Router } from "https://deno.land/x/oak@v7.4.0/mod.ts";

export default function (): Router {
  const router = new Router();
  router.get("/hello", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = { ts: Date.now(), hello: "Hello, world!" };
  });
  return router;
}
