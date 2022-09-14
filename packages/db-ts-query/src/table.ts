export type ColumnType = 'TEXT' | 'INT';

export type ColumnName = string; // TODO: branded type

export interface ColumnSpec {
  type: ColumnType;
  nullable?: boolean;
}

export const addColumn =
  <N extends ColumnName, S extends ColumnSpec, C extends TableColumns>(
    name: Exclude<N, keyof C>,
    spec: S
  ) =>
  (table: Table<C>): Table<AddProperty<C, N, S>> =>
    ({
      ...table,
      [name]: spec,
    } as Table<AddProperty<C, N, S>>);

export type TableColumns = Record<ColumnName, ColumnSpec>;

export type Table<C extends TableColumns> = {
  readonly tableMetadata: {
    readonly name: string;
  };
} & { [K in keyof C]: C[K] };

export const createTable = (name: string): Table<{}> => ({
  tableMetadata: { name },
});
