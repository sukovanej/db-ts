import {
  Connection,
  ConnectionNotOpened,
  ConnectionOpened,
  ConnectionOpenedInTransaction,
} from './connection';
import * as TE from 'fp-ts/TaskEither';
import { ConnectionError, QueryError } from './error';
import { pipe, flow } from 'fp-ts/function';
import { Query } from './query';
import { Result } from './result';

// model

export interface ConnectionAction<I, O, E, A> {
  (connection: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>;
}

declare module 'fp-ts/HKT' {
  interface URItoKind3<R, E, A> {
    ConnectionAction: ConnectionAction<R, R, E, A>;
  }
}

export const URI = 'ConnectionAction';

export type URI = typeof URI;

// combinators

export const map =
  <A, B>(f: (a: A) => B) =>
  <I, E>(fa: ConnectionAction<I, I, E, A>): ConnectionAction<I, I, E, B> =>
    flow(
      fa,
      TE.map(([a, c]) => [f(a), c])
    );

export const chain =
  <I, E, A, B>(f: (a: A) => ConnectionAction<I, I, E, B>) =>
  (fa: ConnectionAction<I, I, E, A>): ConnectionAction<I, I, E, B> =>
    ichain(f)(fa);

export const chainFirst =
  <I, E, A, B>(f: (a: A) => ConnectionAction<I, I, E, B>) =>
  (fa: ConnectionAction<I, I, E, A>): ConnectionAction<I, I, E, A> =>
    chainFirstW(f)(fa);

export const chainFirstW =
  <I, E1, A, B>(f: (a: A) => ConnectionAction<I, I, E1, B>) =>
  <E2>(fa: ConnectionAction<I, I, E2, A>): ConnectionAction<I, I, E1 | E2, A> =>
    flow(
      fa,
      TE.chainFirstW(([a, c]) => f(a)(c))
    );

export const ichain =
  <M, O, E, A, B>(f: (a: A) => ConnectionAction<M, O, E, B>) =>
  <I>(fa: ConnectionAction<I, M, E, A>): ConnectionAction<I, O, E, B> =>
    ichainW(f)(fa);

export const ichainW =
  <M, O, E1, A, B>(f: (a: A) => ConnectionAction<M, O, E1, B>) =>
  <I, E2>(
    fa: ConnectionAction<I, M, E2, A>
  ): ConnectionAction<I, O, E1 | E2, B> =>
    flow(
      fa,
      TE.chainW(([a, c]) => f(a)(c))
    );

export const openConnection: ConnectionAction<
  ConnectionNotOpened,
  ConnectionOpened,
  ConnectionError,
  void
> = connection =>
  pipe(
    connection.connect(),
    TE.map(c => [undefined, c])
  );

export declare function query(query: Query): ConnectionAction<ConnectionOpened, ConnectionOpened, QueryError, Result>;
export declare function query(query: Query): ConnectionAction<ConnectionOpenedInTransaction, ConnectionOpenedInTransaction, QueryError, Result>;

export function query<S extends ConnectionOpened | ConnectionOpenedInTransaction>(query: Query): ConnectionAction<S, S, QueryError, Result> { 
  return connection => connection.query(query);
}
