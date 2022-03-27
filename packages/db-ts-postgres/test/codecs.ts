import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/function';

export const testTableCodec = D.struct({ id: D.number, name: D.string });

export const existsQueryCodec = pipe(
  D.struct({ exists: D.boolean }),
  D.map(s => s.exists)
);
