// Tiny classnames helper -- avoids pulling in a full class-merging
// library for a monorepo this size. Add clsx-style conditional support
// only if a real need for it shows up.
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
