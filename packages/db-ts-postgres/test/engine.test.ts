import { pipe, flow } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import * as DB from 'db-ts';

import * as DE from '../src/engine';

import { testTableCodec } from './codecs';
import {
  isolatedTest,
  logExistingTestTable,
  TEST_DATABASE_ENGINE,
  withTestTable,
} from './utils';
import {
  CREATE_TEST_TABLE_QUERY,
  DROP_TEST_TABLE_QUERY,
  DUMMY_CONFIG,
  TEST_TABLE,
} from './constants';

describe('Postgres engine', () => {
  beforeAll(async () => {
    await pipe(
      TEST_DATABASE_ENGINE,
      DB.withConnection(
        flow(
          TE.of,
          TE.chainFirst(logExistingTestTable),
          TE.chain(DB.query(DROP_TEST_TABLE_QUERY))
        )
      )
    )();
  });

  describe('createPostgresEngine', () => {
    it('creates a truthy object (dummy test)', () =>
      pipe(DUMMY_CONFIG, DE.createPostgresEngine, engine =>
        expect(engine).not.toBeNull()
      ));
  });

  it('is possible to create a table', async () => {
    await isolatedTest(
      flow(
        DB.queryAndPass(CREATE_TEST_TABLE_QUERY),
        TE.chainFirst(DB.query(`SELECT * FROM ${TEST_TABLE}`))
      )
    )();
  });

  describe('basic operators', () => {
    it('insert and select', async () => {
      await withTestTable(
        flow(
          DB.queryAndPass(
            `INSERT INTO "${TEST_TABLE}" (id, name) VALUES (1, 'milan')`
          ),
          TE.chain(DB.query(`SELECT * FROM "${TEST_TABLE}"`)),
          TE.chainEitherKW(flow(DB.all, DB.asList(testTableCodec))),
          TE.map(r => {
            expect(r).toHaveLength(1);
            expect(r[0]).toStrictEqual({ id: 1, name: 'milan' });
          })
        )
      )();
    });

    it('select returns nothing for an empty table', async () => {
      await withTestTable(
        flow(
          DB.query(`SELECT * FROM "${TEST_TABLE}"`),
          TE.chainEitherKW(flow(DB.all, DB.asList(testTableCodec))),
          TE.map(r => expect(r).toHaveLength(0))
        )
      )();
    });
  });
});
