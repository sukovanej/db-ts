export function columns<A, B, C, D, E, F, G, H, I, J, K, L>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G,
  h: H,
  i: I,
  j: J,
  k: K,
  l: L
): [A, B, C, D, E, F, G, H, I, J, K, L];
export function columns<A, B, C, D, E, F, G, H, I, J, K>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G,
  h: H,
  i: I,
  j: J,
  k: K
): [A, B, C, D, E, F, G, H, I, J, K];
export function columns<A, B, C, D, E, F, G, H, I, J>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G,
  h: H,
  i: I,
  j: J
): [A, B, C, D, E, F, G, H, I, J];
export function columns<A, B, C, D, E, F, G, H, I>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G,
  h: H,
  i: I
): [A, B, C, D, E, F, G, H, I];
export function columns<A, B, C, D, E, F, G, H>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G,
  h: H
): [A, B, C, D, E, F, G, H];
export function columns<A, B, C, D, E, F, G>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
  g: G
): [A, B, C, D, E, F, G];
export function columns<A, B, C, D, E, F>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F
): [A, B, C, D, E, F];
export function columns<A, B, C, D, E>(
  a: A,
  b: B,
  c: C,
  d: D,
  e: E
): [A, B, C, D, E];
export function columns<A, B, C, D>(a: A, b: B, c: C, d: D): [A, B, C, D];
export function columns<A, B, C>(a: A, b: B, c: C): [A, B, C];
export function columns<A, B>(a: A, b: B): [A, B];
export function columns<A>(a: A): [A];
export function columns(...args: unknown[]): unknown[] {
  return args;
}
