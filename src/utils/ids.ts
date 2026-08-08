/** Native platform API — no dependency, no Math.random. */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
