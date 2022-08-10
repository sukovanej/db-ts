import { Query } from './query';
import * as TE from 'fp-ts/TaskEither';
import { ConnectionError, QueryError, UnexpectedDatabaseError } from './error';
import { Result } from './result';

export interface ConnectionNotOpened {
  readonly ConnectionNotOpened: unique symbol;
}

export interface ConnectionOpened {
  readonly ConnectionNotOpened: unique symbol;
}

export interface ConnectionOpenedInTransaction {
  readonly ConnectionNotOpened: unique symbol;
}

/**
 * Represents a potential connection to the database.
 *
 * @category model
 */
export interface Connection<S = ConnectionOpened> {
  readonly _S: S;

  readonly connect: (
    this: Connection<ConnectionNotOpened>
  ) => TE.TaskEither<ConnectionError, Connection<ConnectionOpened>>;

  readonly close: (
    this: Connection<ConnectionOpened>
  ) => TE.TaskEither<UnexpectedDatabaseError, Connection<ConnectionNotOpened>>;

  readonly query: <C extends ConnectionOpened | ConnectionOpenedInTransaction>(
    this: Connection<C>,
    query: Query
  ) => TE.TaskEither<QueryError, [Result, Connection<C>]>;

  readonly beginTransaction: (
    this: Connection<ConnectionOpened>
  ) => TE.TaskEither<
    UnexpectedDatabaseError,
    Connection<ConnectionOpenedInTransaction>
  >;

  readonly commitTransaction: (
    this: Connection<ConnectionOpenedInTransaction>
  ) => TE.TaskEither<QueryError, Connection<ConnectionOpened>>;

  readonly rollbackTransaction: (
    this: Connection<ConnectionOpenedInTransaction>
  ) => TE.TaskEither<UnexpectedDatabaseError, Connection<ConnectionOpened>>;
}
