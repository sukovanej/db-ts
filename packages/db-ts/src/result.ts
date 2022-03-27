import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as D from 'io-ts/Decoder';
import { pipe, constant } from 'fp-ts/function';
import { createResultOneError, ResultOneError } from './error';

export type Row = { [column: string]: unknown };

export interface FieldDef {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface Result {
  rows: Row[];
  fields: FieldDef[];
  command: string;
  rowCount: number;
}

// TODO: implement fields and command keys correctly
export const of = (rows: Row[]): Result => ({
  rows,
  fields: [],
  command: 'none',
  rowCount: rows.length,
});

/**
 * Return all rows.
 *
 * @category combinator
 */
export const all = (result: Result): Row[] => result.rows;

/**
 * Return a first row.
 *
 * @category combinator
 */
export const first = (result: Result): O.Option<Row> =>
  pipe(result.rows, A.head);

/**
 * Return exactly one row. If the result set is empty, `NoRowReturned` error is
 * returned. If the result set contains more then one item, `NoRowReturned` error
 * is returned.
 *
 * @category combinator
 */
export const one = (result: Result): E.Either<ResultOneError, Row> =>
  pipe(
    result.rows,
    A.matchLeft(
      constant(pipe('NoRowReturned', createResultOneError, E.left)),
      (head, tail) =>
        A.isEmpty(tail)
          ? E.right(head)
          : E.left(createResultOneError('MoreRowsReturned'))
    )
  );

/**
 * Decode the result using a decoder.
 *
 * @category: combinator
 */
export const as =
  <A, R extends Row | Row[]>(decoder: D.Decoder<R, A>) =>
  (result: R): E.Either<D.DecodeError, A> =>
    pipe(result, decoder.decode);
