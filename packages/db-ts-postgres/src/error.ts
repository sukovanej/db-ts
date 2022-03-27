import { DatabaseError as PostgresDatabaseError } from 'pg';

import {
  ConnectionCloseError,
  ConnectionError,
  createConnectionCloseError,
  createConnectionError,
  createQueryError,
  QueryError,
} from 'db-ts';

export const toConnectionError =
  (defaultMessage: string) =>
  (error: unknown): ConnectionError =>
    isPostgresDatabaseError(error)
      ? createConnectionError(error.message, error)
      : createConnectionError(defaultMessage, error);

export const toQueryError = (error: unknown): QueryError =>
  isPostgresDatabaseError(error)
    ? createQueryError(error.message, error)
    : createQueryError('Unknown', error);

export const toCloseError = (error: unknown): ConnectionCloseError =>
  isPostgresDatabaseError(error)
    ? createConnectionCloseError(error.message, error)
    : createConnectionCloseError('Unknown', error);

export const isPostgresDatabaseError = (
  error: unknown
): error is PostgresDatabaseError => {
  return error instanceof PostgresDatabaseError;
};
