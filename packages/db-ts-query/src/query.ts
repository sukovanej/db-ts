import { pipe } from 'fp-ts/lib/function';
import { columns } from './columns';
import { addColumn, createTable, Table, TableColumns } from './table';

// SELECT

type SelectQueryColumn<C extends TableColumns> = C[keyof C];

export interface SelectQuery<
  T extends Table<C>,
  C extends TableColumns,
  SC extends readonly SelectQueryColumn<C>[]
> {
  readonly table: T;
  readonly columns: SC;
}

export const select = <
  C extends TableColumns,
  SC extends readonly SelectQueryColumn<C>[]
>(
  table: Table<C>,
  columns: SC
): SelectQuery<Table<C>, C, SC> => ({ table: table, columns });

// BOOLEAN EXPRESSION

type OperandExpression<T> = WhereExpression | T | number;

export type BinaryExpression<Op, T> = {
  left: OperandExpression<T>;
  right: OperandExpression<T>;
  op: Op;
};

enum BinaryOperator {
  Equals = 'equals',
  And = 'and',
  Or = 'or',
}

export type EqualsExpression<T> = BinaryExpression<BinaryOperator.Equals, T>;
export type AndExpression<T> = BinaryExpression<BinaryOperator.And, T>;
export type OrExpression<T> = BinaryExpression<BinaryOperator.Or, T>;

export type WhereExpression =
  | OrExpression<unknown>
  | AndExpression<unknown>
  | EqualsExpression<unknown>;

export const equals = <T>(
  left: OperandExpression<T>,
  right: OperandExpression<T>
): WhereExpression => ({
  left,
  right,
  op: BinaryOperator.Equals,
});

export const and = <T>(
  left: WhereExpression<T>,
  right: WhereExpression<T>
): WhereExpression => ({
  left,
  right,
  op: BinaryOperator.And,
});

export const or = <T>(
  left: WhereExpression<T>,
  right: WhereExpression<T>
): WhereExpression => ({
  left,
  right,
  op: BinaryOperator.Or,
});

// SELECT WHERE

export const where =
  <C extends TableColumns, S extends keyof C>(
    whereCondition: WhereExpression
  ) =>
  <T extends Table<C>, SC extends readonly SelectQueryColumn<C>[]>(
    query: SelectQuery<T, C, SC>
  ): SelectWhereQuery<T, C, SC> => ({
    ...query,
    whereCondition,
  });

export interface SelectWhereQuery<
  T extends Table<C>,
  C extends TableColumns,
  SC extends readonly SelectQueryColumn<C>[],
  S
> extends SelectQuery<T, C, SC> {
  whereCondition: WhereExpression<S>;
}

// EXAMPLE
// TODO: delete

const table = pipe(
  createTable('my_table'),
  addColumn('id', { type: 'INT', nullable: false } as const),
  addColumn('name', { type: 'TEXT' } as const)
);

const query = pipe(
  select(table, columns(table.name, table.id)),
  where(equals(table.name, 1))
);
