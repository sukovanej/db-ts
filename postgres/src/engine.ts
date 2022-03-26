import { pipe, hole } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { 
  ConnectionConfig as PostgresConnectionConfig, 
  Client as PostgresClient,
  Pool as PostgresPool,
} from 'pg';

import { Connection, ConnectionConfig, ConnectionError, Engine, Pool } from "db-ts";

import { toConnectionError } from './error';

const toPostgresConnectionConfig = (connectionConfig: ConnectionConfig): PostgresConnectionConfig =>
  connectionConfig

export const createPostgresEngine = (connectionConfig: ConnectionConfig): Engine => pipe(
  connectionConfig,
  toPostgresConnectionConfig,
  (postgresConnectionConfig) => ({
    createConnection: () => createConnection(postgresConnectionConfig),
    createPool: () => createPool(postgresConnectionConfig),
  }),
)

export const createConnection = 
  (postgresConnectionConfig: PostgresConnectionConfig): TE.TaskEither<ConnectionError, Connection> => pipe(
  TE.tryCatch(
    async () => {
      const client = new PostgresClient(postgresConnectionConfig);
      await client.connect();
      return client
    },
    toConnectionError("Unknown error"),
  ),
  TE.map(postgresClientToConnection)
)

export const createPool = (postgresConnectionConfig: PostgresConnectionConfig): Pool => pipe(
  new PostgresPool(postgresConnectionConfig),
  postgresPoolToPool
)

const postgresClientToConnection = (postgresClient: PostgresClient): Connection =>
  hole()

const postgresPoolToPool = (postgresPool: PostgresPool): Pool =>
  hole()
