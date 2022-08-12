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

export const createError =
  <T extends DatabaseError['type']>(type: T) =>
  (detail: string): Extract<DatabaseError, { type: T }> =>
    ({ type, detail } as Extract<DatabaseError, { type: T }>);

export const resultFirstError = createError(
  'ResultFirstError' as ResultFirstError['type']
);

export const createConnectionCloseError = createError('ConnectionCloseError');
export const createConnectionError = createError('ConnectionError');
export const createResultOneError = createError('ResultOneError');
export const createUnexpectedDatabaseError = createError(
  'UnexpectedDatabaseError'
);
export const createQueryError = createError('QueryError');
