import { DatabaseError as PostgresDatabaseError } from 'pg'

import { ConnectionError, createConnectionError } from 'db-ts'

export const toConnectionError =
  (defaultMessage: string) =>
  (error: unknown): ConnectionError =>
    isPostgresDatabaseError(error)
      ? createConnectionError(error.message)
      : createConnectionError(defaultMessage)

export const isPostgresDatabaseError = (
  error: unknown
): error is PostgresDatabaseError => {
  return error instanceof PostgresDatabaseError
}
