import { pipe, flow, constant } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import * as DB from 'db-ts';

import * as DE from '../src/engine';

const TEST_DATABASE_CONFIG: DB.ConnectionConfig = {
  host: 'localhost',
  port: 5432,
  user: 'test',
  database: 'test',
  password: 'test',
};

const DUMMY_CONFIG: DB.ConnectionConfig = {
  host: 'host',
  port: 1234,
  user: 'user',
  database: 'database',
  password: 'password',
};

const TEST_TABLE = 'test_table';

const CREATE_TEST_TABLE_QUERY = `
  CREATE TABLE ${TEST_TABLE} (
    id      integer,
    name    varchar(40),
    PRIMARY KEY(id)
  );
`;

describe('Postgres engine', () => {
  describe('createPostgresEngine', () => {
    it('creates a truthy object (dummy test)', () =>
      pipe(DUMMY_CONFIG, DE.createPostgresEngine, engine =>
        expect(engine).not.toBeNull()
      ));
  });

  it('is possible to create a table', async () => {
    await pipe(
      TE.bracket(
        pipe(
          TEST_DATABASE_CONFIG,
          DE.createPostgresEngine,
          DB.createConnection
        ),
        flow(
          DB.queryAndPass(CREATE_TEST_TABLE_QUERY),
          TE.chain(DB.query(`DROP TABLE ${TEST_TABLE};`))
        ),
        (connection, result) =>
          pipe(
            connection,
            DB.queryAndPass(`DROP TABLE IF EXISTS ${TEST_TABLE};`),
            TE.chainW(DB.closeConnection),
            TE.apSecond(TE.fromEither(result)),
            TE.map(constant(undefined))
          )
      ),
      TE.mapLeft(e => {
        console.error('ERROR: ', e);
        return fail(JSON.stringify(e));
      })
    )();
  });
});
