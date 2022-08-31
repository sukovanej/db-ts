import { pipe } from 'fp-ts/lib/function';

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
  (
    table: Table<C>
  ): Table<{ readonly [K in N | keyof C]: K extends keyof C ? C[K] : S }> => ({
    ...table,
    columns: { ...table.columns, [name]: spec } as {
      readonly [K in N | keyof C]: K extends keyof C ? C[K] : S;
    },
  });

export type TableColumns = Record<ColumnName, ColumnSpec>;

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

// SELECT

type SelectQueryColumn<C> = keyof C | { name: keyof C; alias: string };

export interface SelectQuery<
  T extends Table<C>,
  C extends TableColumns,
  SC extends SelectQueryColumn<C>[]
> {
  readonly table: T['name'];
  readonly columns: SC;
}

export const select = <C extends TableColumns, SC extends (keyof C)[]>(
  table: Table<C>,
  columns: SC
): SelectQuery<Table<C>, C, SC> => ({ table: table.name, columns });

// BOOLEAN EXPRESSION

type OperandExpression<AvailableSymbols> =
  | BooleanExpression<AvailableSymbols>
  | AvailableSymbols
  | number;

export type BinaryExpression<Op, AvailableSymbols> = {
  left: OperandExpression<AvailableSymbols>;
  right: OperandExpression<AvailableSymbols>;
  op: Op;
};

enum BinaryOperator {
  Equals = 'equals',
  And = 'and',
  Or = 'or',
}

export type EqualsExpression<AvailableSymbols> = BinaryExpression<
  BinaryOperator.Equals,
  AvailableSymbols
>;
export type AndExpression<AvailableSymbols> = BinaryExpression<
  BinaryOperator.And,
  AvailableSymbols
>;
export type OrExpression<AvailableSymbols> = BinaryExpression<
  BinaryOperator.Or,
  AvailableSymbols
>;

export type BooleanExpression<AvailableSymbols> =
  | OrExpression<AvailableSymbols>
  | AndExpression<AvailableSymbols>
  | EqualsExpression<AvailableSymbols>;

export const equals = <AvailableSymbols>(
  left: OperandExpression<AvailableSymbols>,
  right: OperandExpression<AvailableSymbols>
): BooleanExpression<AvailableSymbols> => ({
  left,
  right,
  op: BinaryOperator.Equals,
});

export const and = <AvailableSymbols>(
  left: BooleanExpression<AvailableSymbols>,
  right: BooleanExpression<AvailableSymbols>
): BooleanExpression<AvailableSymbols> => ({
  left,
  right,
  op: BinaryOperator.And,
});

export const or = <AvailableSymbols>(
  left: BooleanExpression<AvailableSymbols>,
  right: BooleanExpression<AvailableSymbols>
): BooleanExpression<AvailableSymbols> => ({
  left,
  right,
  op: BinaryOperator.Or,
});

// SELECT WHERE

export const where =
  <C extends TableColumns, AvailableSymbols extends keyof C>(
    whereCondition: BooleanExpression<AvailableSymbols>
  ) =>
  <T extends Table<C>, SC extends SelectQueryColumn<C>[]>(
    query: SelectQuery<T, C, SC>
  ): SelectWhereQuery<T, C, SC, AvailableSymbols> => ({
    ...query,
    whereCondition,
  });

export interface SelectWhereQuery<
  T extends Table<C>,
  C extends TableColumns,
  SC extends SelectQueryColumn<C>[],
  AvailableSymbols
> extends SelectQuery<T, C, SC> {
  whereCondition: BooleanExpression<AvailableSymbols>;
}

// EXAMPLE

const table = pipe(
  createTable('my_table'),
  addColumn('id', { type: 'INT', nullable: false }),
  addColumn('name', { type: 'TEXT' })
);

const query = pipe(
  select(table, ['name', 'id']),
  where(equals('name' as const, 1))
);
