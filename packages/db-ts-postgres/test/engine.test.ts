import { pipe, flow } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

// TODO: fix
import * as DB from 'db-ts/src';
import * as DBA from 'db-ts/src/connectionAction';

import * as DE from '../src/engine';

import { testTableCodec } from './codecs';
import {
  ensureTestTableDoesnExist,
  isolatedTest,
  withTestTable,
} from './utils';
import { CREATE_TEST_TABLE_QUERY, DUMMY_CONFIG, TEST_TABLE } from './constants';

describe('Postgres engine', () => {
  beforeAll(async () => await ensureTestTableDoesnExist());

  describe('createPostgresEngine', () => {
    it('creates a truthy object (dummy test)', () =>
      pipe(DUMMY_CONFIG, DE.createPostgresEngine, engine =>
        expect(engine).not.toBeNull()
      ));
  });

  it('is possible to create a table', async () => {
    await isolatedTest(
      pipe(
        DBA.query(CREATE_TEST_TABLE_QUERY),
        DBA.chainFirst(() => DBA.query(DB.sql`SELECT * FROM ${TEST_TABLE}`))
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
