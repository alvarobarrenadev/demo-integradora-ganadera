/**
 * Rounds to a fixed number of decimals without the classic IEEE-754 drift of
 * `Math.round(value * 10**decimals) / 10**decimals` (e.g. 1.005 * 100 is
 * 100.49999999999999 as a float, so a naive round mis-rounds it to 100.49).
 *
 * Uses the exponential-notation string trick: parsing "1.005e2" makes the JS
 * engine round the exact decimal value 100.5 to the nearest double in one
 * step, instead of rounding 1.005 to a double first and then multiplying
 * (which compounds the error).
 */
export function roundTo(value: number, decimals: number): number {
  const shifted = Number(`${value}e${decimals}`)
  const rounded = Math.round(shifted)
  return Number(`${rounded}e-${decimals}`)
}
