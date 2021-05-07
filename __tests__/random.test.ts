import { assert } from "https://deno.land/std@0.95.0/testing/asserts.ts";

import * as rand from "../crypto/random.ts";

/*
  Random value generators.
  Each test runs 10,000 iterations, asserting every time.
*/

// Ensure the value generated is a float between 0 and 1
Deno.test("random_gen", () => {
  for (let i = 0; i < 10000; i++) {
    const random = rand.random();
    assert(random <= 1 && random >= 0);
  }
});

// Ensure the value is an integer between Int32.MIN and Int32.MAX
Deno.test("random_int", () => {
  for (let i = 0; i < 10000; i++) {
    const random = rand.randomInt();
    assert(random <= 2147483647 && random >= -2147483648);
  }
});

// Ensure the value is an unsigned integer between 0 and Uint32.MAX
Deno.test("random_uint", () => {
  for (let i = 0; i < 10000; i++) {
    const random = rand.randomUInt();
    assert(random <= 4294967295 && random >= 0);
  }
});

/*
  Ensure that a random bool is generated.
  Should always return true if weight is 1.
*/
Deno.test("random_boolean", () => {
  for (let i = 0; i < 10000; i++) {
    const random = rand.randomBool(1);
    assert(random);
  }
});
