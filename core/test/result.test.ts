import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';


import * as DR from '../src/result';

describe("Result", () => {
  describe("all", () => {
    it("returns all items", () => pipe(
      DR.of([{ id: 1 }, { id: 2 }]),
      DR.all,
      (xs) => expect(xs).toHaveLength(2)
    ));

    it("returns empty list for empty result", () => pipe(
      DR.of([]),
      DR.all,
      (xs) => expect(xs).toHaveLength(0)
    ));
  });

  describe("first", () => {
    it("returns first on a single item result", () => pipe(
      DR.of([{ id: 1}]),
      DR.first,
      (xs) => expect(xs).toStrictEqual(O.some({ id: 1}))
    ));

    it("returns first on a multi item result", () => pipe(
      DR.of([{ id: 1}, { id: 2}]),
      DR.first,
      (xs) => expect(xs).toStrictEqual(O.some({ id: 1}))
    ));

    it("returns none for an empty result", () => pipe(
      DR.of([]),
      DR.first,
      (xs) => expect(xs).toStrictEqual(O.none)
    ));
  });
});
