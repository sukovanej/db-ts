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

export type ConnectionState =
  | ConnectionNotOpened
  | ConnectionOpened
  | ConnectionOpenedInTransaction;

/**
 * Represents a potential connection to the database.
 *
 * @category model
 */
export interface Connection<S = ConnectionOpened> {
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
  ) => TE.TaskEither<UnexpectedDatabaseError, Connection<ConnectionOpened>>;

  readonly rollbackTransaction: (
    this: Connection<ConnectionOpenedInTransaction>
  ) => TE.TaskEither<UnexpectedDatabaseError, Connection<ConnectionOpened>>;
}

export const unsafeConnectionTo = <
  S1 extends ConnectionState,
  S2 extends ConnectionState
>(
  connection: Connection<S1>
): Connection<S2> => connection as unknown as Connection<S2>;
