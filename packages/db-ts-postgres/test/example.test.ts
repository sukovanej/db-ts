import { pipe } from 'fp-ts/function';

import * as DB from 'db-ts';
import * as DBA from 'db-ts/src/connectionAction';

import { ensureTestTableDoesnExist, withTestTable } from './utils';
import { TEST_TABLE } from './constants';
import { testTableCodec, TestTable } from './codecs';

const exampleRepository = ({
  getOne: (id: number) =>
    pipe(
      DBA.query(DB.sql`SELECT * FROM "${TEST_TABLE}" WHERE id = '${id.toString()}' FOR UPDATE;`),
      DBA.chainEitherK(DB.oneAs(testTableCodec)),
    ),
  getList: () =>
    pipe(
      DBA.query(DB.sql`SELECT * FROM "${TEST_TABLE}"`),
      DBA.chainEitherKW(DB.allAs(testTableCodec)),
    ),
  persist: (testTable: TestTable) =>
    DBA.query(
      DB.sql`INSERT INTO "${TEST_TABLE}" (id, name) VALUES (${testTable.id.toString()}, '${testTable.name}')`
    ),
});

describe('Postgres engine', () => {
  beforeAll(async () => await ensureTestTableDoesnExist());

  it('getOne after persist', async () =>
    await withTestTable(
      pipe(
        exampleRepository.persist({ id: 1, name: 'milan' }),
        DBA.chain(() => exampleRepository.getOne(1)),
        DBA.map(item => expect(item).toStrictEqual({ id: 1, name: 'milan' }))
      )
    )());

  it('getList after persist', async () =>
    await withTestTable(
      pipe(
        exampleRepository.persist({ id: 1, name: 'milan' }),
        DBA.chainW(() => exampleRepository.persist({ id: 2, name: 'matej' })),
        DBA.chainW(() => exampleRepository.getList()),
        DBA.map(item =>
          expect(item).toStrictEqual([
            { id: 1, name: 'milan' },
            { id: 2, name: 'matej' },
          ])
        )
      )
    )());
});
