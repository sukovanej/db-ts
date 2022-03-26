import * as TE from 'fp-ts/TaskEither'

import { ConnectionCloseError, QueryError } from './error'
import { Query } from './query'
import { Result } from './result'

export interface Connection {
  query: (query: Query) => TE.TaskEither<QueryError, Result>
  close: () => TE.TaskEither<ConnectionCloseError, void>
}

export interface ConnectionConfig {
  user: string
  database: string
  password: string
  port: number
  host: string
}
