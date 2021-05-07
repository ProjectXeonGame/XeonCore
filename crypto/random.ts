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

/**
 * Generate a random 32-bit integer.
 */
export function randomInt(): number;
/**
 * Generate a random 32-bit integer.
 * @param max - maximum value for the integer.
 */
export function randomInt(max: number): number;
/**
 * Generate a random 32-bit integer.
 * @param max - maximum value for the integer.
 * @param min - minimum value for the integer.
 */
export function randomInt(max: number, min: number): number;
export function randomInt(
  max: number = 2147483647,
  min: number = -2147483648,
): number {
  return Math.round(random() * (max - min) + min);
}

/**
 * Generate a random 32-bit unsigned integer.
 */
export function randomUInt(): number;
/**
 * Generate a random 32-bit unsigned integer.
 * @param max - maximum value for the unsigned integer.
 */
export function randomUInt(max: number): number;
export function randomUInt(max: number = 4294967295): number {
  return Math.round(random() * max);
}

/**
 * Generate a random boolean value.
 */
export function randomBool(): boolean;
/**
 * Generate a random boolean value.
 * @param weight - float between 0 and 1 to determine the "chance".
 */
export function randomBool(weight: number): boolean;
export function randomBool(weight?: number): boolean {
  weight = weight || 0.5;
  return random() <= weight;
}
