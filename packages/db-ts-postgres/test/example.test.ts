import { pipe, flow } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import * as DB from 'db-ts';

import { ensureTestTableDoesnExist, withTestTable } from './utils';
import { TEST_TABLE } from './constants';
import { testTableCodec, TestTable } from './codecs';

const makeExampleRepository = (connection: DB.Connection) => ({
  getOne: (id: number) =>
    pipe(
      connection,
      DB.query(`SELECT * FROM "${TEST_TABLE}" WHERE id = '${id}' FOR UPDATE;`),
      TE.chainEitherK(DB.oneAs(testTableCodec))
    ),
  getList: () =>
    pipe(
      connection,
      DB.query(`SELECT * FROM "${TEST_TABLE}"`),
      TE.chainEitherKW(DB.allAs(testTableCodec))
    ),
  persist: (testTable: TestTable) =>
    pipe(
      connection,
      DB.query(
        `INSERT INTO "${TEST_TABLE}" (id, name) VALUES (${testTable.id}, '${testTable.name}')`
      )
    ),
});

describe('Postgres engine', () => {
  beforeAll(async () => await ensureTestTableDoesnExist());

  it('getOne after persist', async () =>
    await withTestTable(
      flow(
        makeExampleRepository,
        flow(
          TE.of,
          TE.chainFirst(repository =>
            repository.persist({ id: 1, name: 'milan' })
          )
        ),
        TE.chain(repository => repository.getOne(1)),
        TE.map(item => expect(item).toStrictEqual({ id: 1, name: 'milan' }))
      )
    )());

  it('getList after persist', async () =>
    await withTestTable(
      flow(
        makeExampleRepository,
        flow(
          TE.of,
          TE.chainFirst(repository =>
            repository.persist({ id: 1, name: 'milan' })
          ),
          TE.chainFirst(repository =>
            repository.persist({ id: 2, name: 'matej' })
          )
        ),
        TE.chain(repository => repository.getList()),
        TE.map(item =>
          expect(item).toStrictEqual([
            { id: 1, name: 'milan' },
            { id: 2, name: 'matej' },
          ])
        )
      )
    )());
});
