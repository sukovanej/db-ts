import { pipe, flow } from 'fp-ts/function';
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
): TE.TaskEither<DB.DatabaseError | E, void> =>
  pipe(
    DBA.openConnection,
    DBA.chainW(() => fa),
    DBA.ichainW(() => DBA.closeConnection),
    DBA.execConnectionActionAsVoid(TEST_DATABASE_ENGINE.createConnection)
  );

export const withTestTable = <A, E>(
  f: DBA.ConnectionAction<DB.ConnectionOpened, DB.ConnectionOpened, E, A>
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

export const ensureTestTableDoesnExist: TE.TaskEither<DB.DatabaseError, void> = pipe(
  DBA.openConnection,
  DBA.chain(() => logExistingTestTable),
  DBA.chain(() => DBA.query(DROP_TEST_TABLE_QUERY)),
  DBA.execConnectionActionAsVoid(TEST_DATABASE_ENGINE.createConnection),
);
