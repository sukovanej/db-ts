import { pipe } from 'fp-ts/lib/function';

export type ColumnType = 'TEXT' | 'INT';

export interface ColumnSpec {
  type: ColumnType;
}

export const addColumn =
  <N extends string, S extends ColumnSpec, C extends TableColumns>(
    name: Exclude<N, keyof C>,
    spec: S
  ) =>
  (
    table: Table<C>
  ): Table<{ readonly [K in N | keyof C]: K extends keyof C ? C[K] : S }> => ({
    ...table,
    columns: { ...table.columns, [name]: spec } as {
      readonly [K in N | keyof C]: K extends keyof C ? C[K] : S;
    },
  });

export type TableColumns = Record<string, ColumnSpec>;

export interface Table<C extends TableColumns> {
  readonly name: string;
  readonly columns: C;
}

/**
  * createTable
  *
  * ```typescript
  * const table = pipe(
  *   createTable('my_table'),
  *   addColumn('id', { type: 'INT' }),
  *   addColumn('name', { type: 'TEXT' })
  * );
  * ```
*/
export const createTable = (name: string): Table<{}> => ({ name, columns: {} });

type SelectQueryColumns<C extends TableColumns, A extends string> = Record<keyof C, { alias?: A }>;

export interface SelectQuery<T extends Table<C>, C extends TableColumns, SC extends SelectQueryColumns<C>> {
  readonly table: T['name'];
  readonly columns: SC;
}

export const select = <C extends TableColumns, SC extends SelectQueryColumns<C>>(table: Table<C>, columns: SC): SelectQuery<Table<C>, C, SC> =>
  ({ table: table.name, columns });

export interface Query<S> {
  readonly _S: S;
}

// EXAMPLE

const table = pipe(
  createTable('my_table'),
  addColumn('id', { type: 'INT' }),
  addColumn('name', { type: 'TEXT' })
);

const query = select(table, {'id': { alias: 'anotherId'}, 'name': {}});
