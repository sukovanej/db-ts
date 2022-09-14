type RecordName = string | symbol;

type AddProperty<T, N, V> = N extends RecordName
  ? { readonly [K in N | keyof T]: K extends keyof T ? T[K] : V }
  : never;
