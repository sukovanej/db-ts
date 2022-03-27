import { pipe, flow } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

import * as DB from 'db-ts';
import * as DE from '../src/engine';

import { existsQueryCodec } from './codecs';
import {
  CREATE_TEST_TABLE_QUERY,
  TEST_DATABASE_CONFIG,
  TEST_TABLE,
  TEST_TABLE_EXISTS_QUERY,
} from './constants';

function fail(reason?: any): never {
  throw new Error(reason);
}

const reportFail = (e: unknown) => {
  console.error('ERROR: ', e);
  return fail(JSON.stringify(e));
};

// TODO: configure echo using env variables
export const TEST_DATABASE_ENGINE = DE.createPostgresEngine(
  TEST_DATABASE_CONFIG,
  { echo: false }
);

/**
 * Run test in a transaction that is always rollbacked at the end.
 */
export const isolatedTest = <A, E>(
  f: (connection: DB.Connection) => TE.TaskEither<E, A>
): TE.TaskEither<DB.DatabaseError | E, A> =>
  pipe(
    TEST_DATABASE_ENGINE,
    DB.withConnection(connection =>
      TE.bracket(
        pipe(connection, DB.beginTransaction),
        flow(f, TE.mapLeft(reportFail)),
        DB.rollbackTransaction
      )
    )
  );

export const withTestTable = <A, E>(
  f: (connection: DB.Connection) => TE.TaskEither<E, A>
): TE.TaskEither<DB.DatabaseError | E, A> =>
  isolatedTest(flow(DB.queryAndPass(CREATE_TEST_TABLE_QUERY), TE.chainW(f)));

export const logExistingTestTable = flow(
  DB.query(TEST_TABLE_EXISTS_QUERY),
  TE.chainEitherK(DB.oneAs(existsQueryCodec)),
  TE.chainIOK(exists =>
    exists
      ? CO.warn(`Testing table ${TEST_TABLE} already exists, gonna delete it!`)
      : IO.of(undefined)
  )
);
