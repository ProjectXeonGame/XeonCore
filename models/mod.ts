import { Model } from "https://deno.land/x/denodb/mod.ts";

import User from "./users.ts";
import Machine from "./machine.ts";

const models: (typeof Model)[] = [
  User,
  Machine,
];

export default models;
