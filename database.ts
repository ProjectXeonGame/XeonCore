import config from "./config.ts";
import { Database, Relationships } from "https://deno.land/x/denodb/mod.ts";

import models, { relate } from "./models/mod.ts";

console.log("Loading database connector:", config.DATABASE_CONNECTOR);

const connector =
  (await import(`./database/${config.DATABASE_CONNECTOR}.ts`)).default;

const db = new Database({ connector });

relate();

export default async function () {
  await db.link(models);

  if (Deno.env.get("DENO_ENV") == "production") {
    await db.sync();
  } else {
    await db.sync({ drop: true });
  }
}
