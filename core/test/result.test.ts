import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'

import * as DR from '../src/result'
import { createResultOneError } from '../src/error'

describe('Result', () => {
  describe('all', () => {
    it('returns all items', () =>
      pipe(DR.of([{ id: 1 }, { id: 2 }]), DR.all, xs =>
        expect(xs).toHaveLength(2)
      ))

    it('returns empty list for empty result', () =>
      pipe(DR.of([]), DR.all, xs => expect(xs).toHaveLength(0)))
  })

  describe('first', () => {
    it('returns first on a single item result', () =>
      pipe(DR.of([{ id: 1 }]), DR.first, xs =>
        expect(xs).toStrictEqual(O.some({ id: 1 }))
      ))

    it('returns first on a multi item result', () =>
      pipe(DR.of([{ id: 1 }, { id: 2 }]), DR.first, xs =>
        expect(xs).toStrictEqual(O.some({ id: 1 }))
      ))

    it('returns none for an empty result', () =>
      pipe(DR.of([]), DR.first, xs => expect(xs).toStrictEqual(O.none)))
  })

  describe('first', () => {
    it('returns one on a single item result', () =>
      pipe(DR.of([{ id: 1 }]), DR.one, xs =>
        expect(xs).toStrictEqual(E.right({ id: 1 }))
      ))

    it('returns an error on a multi item result', () =>
      pipe(DR.of([{ id: 1 }, { id: 2 }]), DR.one, xs =>
        expect(xs).toStrictEqual(
          E.left(createResultOneError('MoreRowsReturned'))
        )
      ))

    it('returns an error for an empty result', () =>
      pipe(DR.of([]), DR.one, xs =>
        expect(xs).toStrictEqual(E.left(createResultOneError('NoRowReturned')))
      ))
  })
})
