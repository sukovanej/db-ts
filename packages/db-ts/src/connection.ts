import * as TE from 'fp-ts/TaskEither';

import { DatabaseError, QueryError } from './error';
import { Query } from './query';
import { Result } from './result';

export interface Connection {
  query: (query: Query) => TE.TaskEither<QueryError, Result>;
  close: () => TE.TaskEither<DatabaseError, void>;
}

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
  (query: Query) =>
  (connection: Connection): TE.TaskEither<QueryError, Result> =>
    connection.query(query);

/**
 * Close the connection.
 *
 * @category combinators
 */
export const closeConnection = (
  connection: Connection
): TE.TaskEither<DatabaseError, void> => connection.close();
