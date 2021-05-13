import config from "./config.ts";
import { Database } from "https://deno.land/x/denodb/mod.ts";

import models from "./models/mod.ts";

const connector =
  (await import(`./database/${config.DATABASE_CONNECTOR}.ts`)).default;

const db = new Database({ connector });

export default async function () {
  await db.link(models);
  await db.sync();
}
