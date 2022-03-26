import { pipe } from 'fp-ts/function';

import * as DR from '../src/result';

describe("Result", () => {
  describe("all", () => {
    it("returns all items", () => pipe(
      DR.of([{ id: 1}, { id: 2}]),
      DR.all,
      (xs) => expect(xs).toHaveLength(2)
    ));

    it("returns empty list for empty result", () => pipe(
      DR.of([]),
      DR.all,
      (xs) => expect(xs).toHaveLength(0)
    ));
  });
});
