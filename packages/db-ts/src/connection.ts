import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

import { DatabaseError } from './error';
import { Query } from './query';
import { Result } from './result';

/**
 * Represents an open connection to the database.
 *
 * @category model
 */
export interface Connection {
  query: (query: Query) => TE.TaskEither<DatabaseError, Result>;
  close: () => TE.TaskEither<DatabaseError, void>;

  beginTransaction: () => TE.TaskEither<DatabaseError, void>;
  commitTransaction: () => TE.TaskEither<DatabaseError, void>;
  rollbackTransaction: () => TE.TaskEither<DatabaseError, void>;
}

/**
 * Represents an open connection to the database within a transaction.
 *
 * @category model
 */
export interface ConnectionInTransaction extends Connection {
  _tag: 'InTransaction';
}

/**
 * Configuration needed to connect to the database.
 *
 * @category model
 */
export interface ConnectionConfig {
  user: string;
  database: string;
  password: string;
  port: number;
  host: string;
}

/**
 * Run a query on the connection.
 *
 * @category combinators
 */
export const query =
  (queryInput: Query) =>
  (connection: Connection): ReturnType<Connection['query']> =>
    connection.query(queryInput);

/**
 * Run a query on the connection, discard the result and return the connection back.
 *
 * @category combinators
 */
export const queryAndPass =
  (queryInput: Query) =>
  (connection: Connection): TE.TaskEither<DatabaseError, Connection> =>
    pipe(TE.of(connection), TE.chainFirst(query(queryInput)));

/**
 * Close the connection.
 *
 * @category combinators
 */
export const closeConnection = (
  connection: Connection
): ReturnType<Connection['close']> => connection.close();

/**
 * Start a new transaction on the connection.
 *
 * @category combinators
 */
export const beginTransaction = (
  connection: Connection
): TE.TaskEither<DatabaseError, ConnectionInTransaction> =>
  pipe(
    connection.beginTransaction(),
    TE.apSecond(TE.of({ ...connection, _tag: 'InTransaction' }))
  );

/**
 * Commit transaction on the connection.
 *
 * @category combinators
 */
export const commitTransaction = (
  connection: ConnectionInTransaction
): ReturnType<ConnectionInTransaction['commitTransaction']> =>
  connection.commitTransaction();

/**
 * Rollback transaction on the connection.
 *
 * @category combinators
 */
export const rollbackTransaction = (
  connection: ConnectionInTransaction
): ReturnType<ConnectionInTransaction['rollbackTransaction']> =>
  connection.rollbackTransaction();

/**
 * Run `ConnectionInTransaction -> TE.TaskEither<E, A>` in a transaction.
 *
 * @category combinators
 */
export const inTransaction =
  <E, A>(f: (connection: ConnectionInTransaction) => TE.TaskEither<E, A>) =>
  (connection: Connection): TE.TaskEither<E | DatabaseError, A> =>
    TE.bracket<DatabaseError | E, ConnectionInTransaction, A>(
      pipe(connection, beginTransaction),
      f,
      (connection, result) =>
        pipe(
          connection,
          E.isLeft(result) ? rollbackTransaction : commitTransaction
        )
    );
