export * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import { encodeToString } from "https://deno.land/std@0.95.0/encoding/hex.ts";
/**
 * A replacement for Math.random() using crypto-secure random byte generation.
 * @returns A random float between 0 and 1
 */
export function random(): number {
  return parseInt(
    encodeToString(crypto.getRandomValues(new Uint8Array(8))),
    16,
  ) / 18446744073709552000;
}

export function randomInt(): number;
export function randomInt(max: number): number;
export function randomInt(max: number, min: number): number;
export function randomInt(
  max: number = 2147483647,
  min: number = -2147483648,
): number {
  return Math.round(random() * (max - min) + min);
}

export function randomUInt(): number;
export function randomUInt(max: number): number;
export function randomUInt(max: number = 4294967295): number {
  return Math.round(random() * max);
}

export function randomBool(weight: number): boolean;
export function randomBool(): boolean;
export function randomBool(weight?: number): boolean {
  weight = weight || 0.5;
  return random() <= weight;
}
