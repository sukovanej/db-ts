import {
  Connection,
  ConnectionNotOpened,
  ConnectionOpened,
  ConnectionOpenedInTransaction,
} from './connection';
import * as TE from 'fp-ts/TaskEither';
import * as IO from 'fp-ts/IO';
import * as FE from 'fp-ts/FromEither';
import * as FIO from 'fp-ts/FromIO';
import * as M from 'fp-ts/Monad';
import * as C from 'fp-ts/Chain';
import * as F from 'fp-ts/Functor';
import * as A from 'fp-ts/Apply';
import * as E from 'fp-ts/Either';
import { ConnectionError, QueryError, UnexpectedDatabaseError } from './error';
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

// non-pipable

const _map: F.Functor3<URI>['map'] = (fa, f) => pipe(fa, map(f));
const _apPar: A.Apply3<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa));
const _chain: C.Chain3<URI>['chain'] = (ma, f) => pipe(ma, chain(f));

// combinators

export const map =
  <A, B>(f: (a: A) => B) =>
  <I, E>(fa: ConnectionAction<I, I, E, A>): ConnectionAction<I, I, E, B> =>
    flow(
      fa,
      TE.map(([a, c]) => [f(a), c])
    );

export const ap =
  <I, E, A>(fa: ConnectionAction<I, I, E, A>) =>
  <B>(
    fab: ConnectionAction<I, I, E, (a: A) => B>
  ): ConnectionAction<I, I, E, B> =>
  c =>
    pipe(
      fab(c),
      TE.map(([a]) => a),
      TE.ap(
        pipe(
          fa(c),
          TE.map(([a]) => a)
        )
      ),
      TE.map(a => [a, c])
    );

export const ichainW =
  <M, O, E1, A, B>(f: (a: A) => ConnectionAction<M, O, E1, B>) =>
  <I, E2>(
    fa: ConnectionAction<I, M, E2, A>
  ): ConnectionAction<I, O, E1 | E2, B> =>
    flow(
      fa,
      TE.chainW(([a, c]) => f(a)(c))
    );

export const ichain: <M, O, E, A, B>(
  f: (a: A) => ConnectionAction<M, O, E, B>
) => <I>(fa: ConnectionAction<I, M, E, A>) => ConnectionAction<I, O, E, B> =
  ichainW;

export const chainW: <O, E1, A, B>(
  f: (a: A) => ConnectionAction<O, O, E1, B>
) => <E2, I>(
  fa: ConnectionAction<I, O, E2, A>
) => ConnectionAction<I, O, E1 | E2, B> = ichainW;

export const chain: <O, E, A, B>(
  f: (a: A) => ConnectionAction<O, O, E, B>
) => <I>(fa: ConnectionAction<I, O, E, A>) => ConnectionAction<I, O, E, B> =
  chainW;

export const orElseW =
  <O, E1, E2, B>(f: (e: E1) => ConnectionAction<O, O, E2, B>) =>
  <A, I>(
    fa: ConnectionAction<I, O, E1, A>
  ): ConnectionAction<I, O, E1 | E2, A | B> =>
  c =>
    pipe(
      fa(c),
      TE.orElseW(e => f(e)(c as unknown as Connection<O>)) // TODO: something's fishy
    );

export const orElse: <O, E, A>(
  f: (e: E) => ConnectionAction<O, O, E, A>
) => <I>(fa: ConnectionAction<I, O, E, A>) => ConnectionAction<I, O, E, A> =
  orElseW;

//export const apSecond =
//  <I, E1, A, B>(fb: ConnectionAction<I, I, E1, B>) =>
//  <O, E2>(fa: ConnectionAction<I, O, E2, A>): ConnectionAction<I, O, E1 | E2, B> =>
//    connection => pipe(
//      fa(connection),
//      TE.apSecond(fb(connection))
//    )

export const chainFirstW =
  <I, E1, A, B>(f: (a: A) => ConnectionAction<I, I, E1, B>) =>
  <O, E2>(
    fa: ConnectionAction<I, O, E2, A>
  ): ConnectionAction<I, O, E1 | E2, A> =>
    flow(
      fa,
      TE.chainFirstW(([a, c]) => f(a)(c as unknown as Connection<I>))
    );

export const chainFirst: <I, E, A, B>(
  f: (a: A) => ConnectionAction<I, I, E, B>
) => (fa: ConnectionAction<I, I, E, A>) => ConnectionAction<I, I, E, A> =
  chainFirstW;

export const chainEitherKW =
  <E1, A, B>(f: (a: A) => E.Either<E1, B>) =>
  <I, O, E2>(
    ma: ConnectionAction<I, O, E2, A>
  ): ConnectionAction<I, O, E1 | E2, B> =>
  c =>
    pipe(
      ma(c),
      TE.chainEitherKW(([a, c]) =>
        pipe(
          f(a),
          E.map(a => [a, c])
        )
      )
    );

export const chainEitherK: <E, A, B>(
  f: (a: A) => E.Either<E, B>
) => <I, O>(ma: ConnectionAction<I, O, E, A>) => ConnectionAction<I, O, E, B> =
  chainEitherKW;

export const chainIOK =
  <A, B>(f: (a: A) => IO.IO<B>) =>
  <I, O, E>(ma: ConnectionAction<I, O, E, A>): ConnectionAction<I, O, E, B> =>
  c =>
    pipe(
      ma(c),
      TE.chainIOK(([a, c]) =>
        pipe(
          f(a),
          IO.map(a => [a, c])
        )
      )
    );

// destructors

export const execConnectionAction =
  <I>(connection: Connection<I>) =>
  <O, E, A>(
    connectionAction: ConnectionAction<I, O, E, A>
  ): TE.TaskEither<E, A> =>
    pipe(
      connectionAction(connection),
      TE.map(([a]) => a)
    );

export const execConnectionActionAsVoid =
  <I>(connection: Connection<I>) =>
  <O, E, A>(
    connectionAction: ConnectionAction<I, O, E, A>
  ): TE.TaskEither<E, void> =>
    pipe(
      connectionAction(connection),
      TE.map(() => undefined)
    );

// constructors

export const right =
  <I, E = never, A = never>(a: A): ConnectionAction<I, I, E, A> =>
  c =>
    pipe(
      TE.of<E, A>(a),
      TE.map(a => [a, c])
    );

export const of: <I, A, E = never>(a: A) => ConnectionAction<I, I, E, A> =
  right;

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

export const query =
  <S extends ConnectionOpened | ConnectionOpenedInTransaction>(
    query: Query
  ): ConnectionAction<S, S, QueryError, Result> =>
  connection =>
    connection.query(query);

export const closeConnection: ConnectionAction<
  ConnectionOpened,
  ConnectionNotOpened,
  UnexpectedDatabaseError,
  void
> = connection =>
  pipe(
    connection.close(),
    TE.map(c => [undefined, c])
  );

export const beginTransaction: ConnectionAction<
  ConnectionOpened,
  ConnectionOpenedInTransaction,
  UnexpectedDatabaseError,
  void
> = connection =>
  pipe(
    connection.beginTransaction(),
    TE.map(c => [undefined, c])
  );

export const rollbackTransaction: ConnectionAction<
  ConnectionOpenedInTransaction,
  ConnectionOpened,
  UnexpectedDatabaseError,
  void
> = connection =>
  pipe(
    connection.rollbackTransaction(),
    TE.map(c => [undefined, c])
  );

export const commitTransaction: ConnectionAction<
  ConnectionOpenedInTransaction,
  ConnectionOpened,
  UnexpectedDatabaseError,
  void
> = connection =>
  pipe(
    connection.commitTransaction(),
    TE.map(c => [undefined, c])
  );

// Natural transformations

export const fromEither: FE.FromEither3<URI>['fromEither'] = e => c =>
  pipe(
    TE.fromEither(e),
    TE.map(a => [a, c])
  );

export const fromIO: FIO.FromIO3<URI>['fromIO'] =
  <R, E, A>(i: IO.IO<A>) =>
  (c: Connection<R>) =>
    pipe(
      TE.fromIO<A, E>(i),
      TE.map(a => [a, c])
    );

// Instances

export const FromEither: FE.FromEither3<URI> = {
  URI,
  fromEither,
};

export const FromIO: FIO.FromIO3<URI> = {
  URI,
  fromIO,
};

export const Chain: C.Chain3<URI> = {
  URI,
  map: _map,
  ap: _apPar,
  chain: _chain,
};

export const Monad: M.Monad3<URI> = {
  URI,
  map: _map,
  ap: _apPar,
  chain: _chain,
  of,
};
