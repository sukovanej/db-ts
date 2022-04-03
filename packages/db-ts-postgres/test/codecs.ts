import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

export const testTableCodec = D.struct({ id: D.number, name: D.string });

export type TestTable = D.TypeOf<typeof testTableCodec>;
export type TestTableInput = Omit<TestTable, 'id'>;

export const existsQueryCodec = pipe(
  D.struct({ exists: D.boolean }),
  D.map(s => s.exists)
);
