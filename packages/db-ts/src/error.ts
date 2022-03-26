import { pipe } from 'fp-ts/function';

export interface DatabaseError {
  type: string;
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

type DatabaseErrorFromType<T> = T extends ConnectionError['type']
  ? ConnectionError
  : T extends ConnectionCloseError['type']
  ? ConnectionCloseError
  : T extends QueryError['type']
  ? QueryError
  : T extends ResultOneError['type']
  ? ResultOneError
  : unknown;

const createError = <T>(type: T): DatabaseErrorFromType<T> =>
  ({ type } as DatabaseErrorFromType<T>);

export const createConnectionCloseError = (
  detail: ConnectionCloseError['detail']
): ConnectionCloseError =>
  pipe(
    'ConnectionCloseError' as ConnectionCloseError['type'],
    createError,
    obj => ({
      ...obj,
      detail,
    })
  );

export const createConnectionError = (
  detail: ConnectionError['detail']
): ConnectionError =>
  pipe('ConnectionError' as ConnectionError['type'], createError, obj => ({
    ...obj,
    detail,
  }));

export const createResultOneError = (
  detail: ResultOneError['detail']
): ResultOneError =>
  pipe('ResultOneError' as ResultOneError['type'], createError, obj => ({
    ...obj,
    detail,
  }));

export const createQueryError = (detail: QueryError['detail']): QueryError =>
  pipe('QueryError' as QueryError['type'], createError, obj => ({
    ...obj,
    detail,
  }));
