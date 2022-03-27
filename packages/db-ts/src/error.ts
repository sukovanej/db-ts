import { pipe } from 'fp-ts/function';

export interface DatabaseError {
  type: string;
  driverError: unknown;
}

export interface ConnectionError extends DatabaseError {
  type: 'ConnectionError';
  detail: string;
}

export interface ConnectionCloseError extends DatabaseError {
  type: 'ConnectionCloseError';
  detail: string;
}

export interface QueryError extends DatabaseError {
  type: 'QueryError';
  detail: 'UniqueViolation' | 'Unknown' | string;
}

export interface ResultOneError extends DatabaseError {
  type: 'ResultOneError';
  detail: 'MoreRowsReturned' | 'NoRowReturned';
}

export interface ResultFirstError extends DatabaseError {
  type: 'ResultFirstError';
}

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
  pipe(
    'ConnectionCloseError' as ConnectionCloseError['type'],
    createError,
    obj => ({
      ...obj,
      detail,
      driverError,
    })
  );

export const createConnectionError = (
  detail: ConnectionError['detail'],
  driverError: unknown = null
): ConnectionError =>
  pipe('ConnectionError' as ConnectionError['type'], createError, obj => ({
    ...obj,
    detail,
    driverError,
  }));

export const createResultOneError = (
  detail: ResultOneError['detail'],
  driverError: unknown = null
): ResultOneError =>
  pipe('ResultOneError' as ResultOneError['type'], createError, obj => ({
    ...obj,
    detail,
    driverError,
  }));

export const createQueryError = (
  detail: QueryError['detail'],
  driverError: unknown = null
): QueryError =>
  pipe('QueryError' as QueryError['type'], createError, obj => ({
    ...obj,
    detail,
    driverError,
  }));
