export function $ok(o: unknown): boolean {
  return o !== undefined && o !== null;
}

export type Nullable<V> = V | null | undefined;

export function $isstring(o: unknown): boolean {
  return typeof o === 'string';
}

export function $isarray(o: unknown): boolean {
  return Array.isArray(o);
}

export function $count<T = unknown>(a: Nullable<ArrayLike<T>>) {
  return $ok(a) ? a?.length : 0;
}
