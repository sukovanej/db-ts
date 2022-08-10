import { pipe } from 'fp-ts/function';

export interface ConnectionError {
  type: 'ConnectionError';
  detail: string;
}

export interface ConnectionCloseError {
  type: 'ConnectionCloseError';
  detail: string;
}

export interface QueryError {
  type: 'QueryError';
  detail: 'UniqueViolation' | 'Unknown' | string;
}

export interface ResultOneError {
  type: 'ResultOneError';
  detail: 'MoreRowsReturned' | 'NoRowReturned';
}

export interface ResultFirstError {
  type: 'ResultFirstError';
}

export interface UnexpectedDatabaseError {
  type: 'UnexpectedDatabaseError';
  detail: string;
}

export type DatabaseError =
  | ConnectionError
  | ConnectionCloseError
  | QueryError
  | ResultOneError
  | ResultFirstError
  | UnexpectedDatabaseError;

type DatabaseErrorFromType<T> = T extends ConnectionError['type']
  ? ConnectionError
  : T extends ConnectionCloseError['type']
  ? ConnectionCloseError
  : T extends QueryError['type']
  ? QueryError
  : T extends ResultOneError['type']
  ? ResultOneError
  : T extends ResultFirstError['type']
  ? ResultFirstError
  : unknown;

export const createError = <T>(type: T): DatabaseErrorFromType<T> =>
  ({ type } as DatabaseErrorFromType<T>);

export const resultFirstError = createError(
  'ResultFirstError' as ResultFirstError['type']
);

export const createConnectionCloseError = (
  detail: ConnectionCloseError['detail'],
  driverError: unknown = null
): ConnectionCloseError =>
  pipe('ConnectionCloseError' as const, createError, obj => ({
    ...obj,
    detail,
    driverError,
  }));

export const createConnectionError = (
  detail: ConnectionError['detail'],
  driverError: unknown = null
): ConnectionError =>
  pipe(createError('ConnectionError' as const), obj => ({
    ...obj,
    detail,
    driverError,
  }));

export const createResultOneError = (
  detail: ResultOneError['detail'],
  driverError: unknown = null
): ResultOneError =>
  pipe(createError('ResultOneError' as const), obj => ({
    ...obj,
    detail,
    driverError,
  }));

export const createQueryError = (
  detail: QueryError['detail'],
  driverError: unknown = null
): QueryError =>
  pipe(createError('QueryError' as const), obj => ({
    ...obj,
    detail,
    driverError,
  }));
