import { pipe, flow, apply } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

// TODO: fix build
import * as DB from 'db-ts/src';
import * as DBA from 'db-ts/src/connectionAction';
import * as DE from '../src/engine';

import { existsQueryCodec } from './codecs';
import {
  CREATE_TEST_TABLE_QUERY,
  DROP_TEST_TABLE_QUERY,
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
  fa: DBA.ConnectionAction<DB.ConnectionOpened, DB.ConnectionOpened, E, A>
): TE.TaskEither<DB.DatabaseError | E, A> =>
  pipe(
    DBA.openConnection,
    DBA.ichainW(() => fa),
    apply(TEST_DATABASE_ENGINE.createConnection)
  );

export const withTestTable = <A, E>(
  f: DBA.ConnectionAction<DB.ConnectionOpened, DB.ConnectionOpened, E, A>
): TE.TaskEither<DB.DatabaseError | E, A> =>
  isolatedTest(flow(DBA.query(CREATE_TEST_TABLE_QUERY), TE.chainW(f)));

export const logExistingTestTable = flow(
  DB.query(TEST_TABLE_EXISTS_QUERY),
  TE.chainEitherK(DB.oneAs(existsQueryCodec)),
  TE.chainIOK(exists =>
    exists
      ? CO.warn(`Testing table ${TEST_TABLE} already exists, gonna delete it!`)
      : IO.of(undefined)
  )
);

export const ensureTestTableDoesnExist = pipe(
  TEST_DATABASE_ENGINE,
  DB.withConnection(
    flow(
      TE.of,
      TE.chainFirst(logExistingTestTable),
      TE.chain(DB.query(DROP_TEST_TABLE_QUERY))
    )
  )
);
