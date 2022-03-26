import { pipe, hole } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import {
  ConnectionConfig as PostgresConnectionConfig,
  Client as PostgresClient,
  Pool as PostgresPool,
  QueryResult as PostgresResult,
} from 'pg';

import * as DB from 'db-ts';

import {
  toCloseError,
  toConnectionError,
  toQueryError,
  toTransactionError,
} from './error';

const toPostgresConnectionConfig = (
  connectionConfig: DB.ConnectionConfig
): PostgresConnectionConfig => connectionConfig;

export const createPostgresEngine = (
  connectionConfig: DB.ConnectionConfig
): DB.Engine =>
  pipe(
    connectionConfig,
    toPostgresConnectionConfig,
    postgresConnectionConfig => ({
      createConnection: () => createConnection(postgresConnectionConfig),
      createPool: () => createPool(postgresConnectionConfig),
    })
  );

export const createConnection = (
  postgresConnectionConfig: PostgresConnectionConfig
): TE.TaskEither<DB.DatabaseError, DB.Connection> =>
  pipe(
    TE.tryCatch(async () => {
      const client = new PostgresClient(postgresConnectionConfig);
      await client.connect();
      return client;
    }, toConnectionError('Unknown error')),
    TE.map(postgresClientToConnection)
  );

export const createPool = (
  postgresConnectionConfig: PostgresConnectionConfig
): DB.Pool =>
  pipe(new PostgresPool(postgresConnectionConfig), postgresPoolToPool);

const postgresClientToConnection = (
  postgresClient: PostgresClient
): DB.Connection =>
  pipe(postgresClient, client => ({
    query: clientToQueryFn(client),
    close: clientToCloseFn(client),
    beginTransaction: () => beginTransaction(client),
    commitTransaction: () => commitTransaction(client),
    rollbackTransaction: () => rollbackTransaction(client),
  }));

const queryAndReturnVoid = (
  postgresClient: PostgresClient,
  query: string
): TE.TaskEither<DB.DatabaseError, void> =>
  pipe(
    TE.tryCatch(() => postgresClient.query(query), toTransactionError),
    TE.map(undefined)
  );

const beginTransaction = (
  postgresClient: PostgresClient
): ReturnType<DB.Connection['beginTransaction']> =>
  queryAndReturnVoid(postgresClient, 'BEGIN;');

const commitTransaction = (
  postgresClient: PostgresClient
): ReturnType<DB.Connection['commitTransaction']> =>
  queryAndReturnVoid(postgresClient, 'COMMIT;');

const rollbackTransaction = (
  postgresClient: PostgresClient
): ReturnType<DB.Connection['rollbackTransaction']> =>
  queryAndReturnVoid(postgresClient, 'ROLLBACK;');

// TODO: implement
const postgresPoolToPool = (postgresPool: PostgresPool): DB.Pool =>
  pipe(postgresPool, hole());

const clientToQueryFn =
  (client: PostgresClient): DB.Connection['query'] =>
  (query: string) =>
    pipe(
      TE.tryCatch(() => client.query(query), toQueryError),
      TE.map(toResult)
    );

const toResult = (postgresResult: PostgresResult<any>): DB.Result =>
  postgresResult;

const clientToCloseFn =
  (client: PostgresClient): DB.Connection['close'] =>
  () =>
    TE.tryCatch(() => client.end(), toCloseError);
