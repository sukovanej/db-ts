import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

import * as DB from 'db-ts/lib';
import * as DBA from 'db-ts/lib/connectionAction';
import * as DE from '../src/engine';

import { existsQueryCodec } from './codecs';
import {
  CREATE_TEST_TABLE_QUERY,
  DROP_TEST_TABLE_QUERY,
  TEST_DATABASE_CONFIG,
  TEST_TABLE,
  TEST_TABLE_EXISTS_QUERY,
} from './constants';
// import { fail } from 'jest';

// TODO: configure echo using env variables
export const TEST_DATABASE_ENGINE = DE.createPostgresEngine(
  TEST_DATABASE_CONFIG,
  { echo: false }
);

const fail = (msg: any) => {
  throw new Error(JSON.stringify(msg));
};

/**
 * Run test in a transaction that is always rollbacked at the end.
 */
export const isolatedTest = <A, E>(
  fa: DBA.ConnectionAction<
    DB.ConnectionOpenedInTransaction,
    DB.ConnectionOpenedInTransaction,
    E,
    A
  >
): TE.TaskEither<DB.DatabaseError | E, void> =>
  pipe(
    DBA.openConnection,
    DBA.ichainW(() => DBA.beginTransaction),
    DBA.chainW(() => fa),
    DBA.ichainW(() => DBA.rollbackTransaction),
    DBA.ichainW(() => DBA.closeConnection),
    DBA.orElse(e => DBA.of(fail(e))),
    DBA.execConnectionActionAsVoid(TEST_DATABASE_ENGINE.createConnection())
  );

export const withTestTable = <A, E>(
  f: DBA.ConnectionAction<
    DB.ConnectionOpenedInTransaction,
    DB.ConnectionOpenedInTransaction,
    E,
    A
  >
): TE.TaskEither<DB.DatabaseError | E, void> =>
  isolatedTest(
    pipe(
      DBA.query(CREATE_TEST_TABLE_QUERY),
      DBA.chainW(() => f)
    )
  );

export const logExistingTestTable = pipe(
  DBA.query(TEST_TABLE_EXISTS_QUERY),
  DBA.chainEitherK(DB.oneAs(existsQueryCodec)),
  DBA.chainIOK(exists =>
    exists
      ? CO.warn(`Testing table ${TEST_TABLE} already exists, gonna delete it!`)
      : IO.of(undefined)
  )
);

export const ensureTestTableDoesnExist: TE.TaskEither<DB.DatabaseError, void> =
  pipe(
    DBA.openConnection,
    DBA.chain(() => logExistingTestTable),
    DBA.chain(() => DBA.query(DROP_TEST_TABLE_QUERY)),
    DBA.ichainW(() => DBA.closeConnection),
    DBA.orElseW(e => DBA.of(fail(e))),
    DBA.execConnectionActionAsVoid(TEST_DATABASE_ENGINE.createConnection())
  );
