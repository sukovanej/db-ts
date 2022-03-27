import { pipe, hole } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

import {
  ConnectionConfig as PostgresConnectionConfig,
  Client as PostgresClient,
  Pool as PostgresPool,
  QueryResult as PostgresResult,
} from 'pg';

import * as DB from 'db-ts';

import { toCloseError, toConnectionError, toQueryError } from './error';

export type PostgresEngineConfig = {
  echo: boolean;
};

const defaultPostgresEngineConfig: PostgresEngineConfig = {
  echo: false,
};

/**
 * Create an instance of `Engine` for the PostgreSQL.
 *
 * @category constructors
 */
export const createPostgresEngine = (
  connectionConfig: DB.ConnectionConfig,
  engineConfig: PostgresEngineConfig = defaultPostgresEngineConfig
): DB.Engine =>
  pipe(
    connectionConfig,
    toPostgresConnectionConfig,
    postgresConnectionConfig => ({
      createConnection: () =>
        createConnection(postgresConnectionConfig, engineConfig),
      createPool: () => createPool(postgresConnectionConfig, engineConfig),
    })
  );

const toPostgresConnectionConfig = (
  connectionConfig: DB.ConnectionConfig
): PostgresConnectionConfig => connectionConfig;

const createConnection = (
  postgresConnectionConfig: PostgresConnectionConfig,
  engineConfig: PostgresEngineConfig
): TE.TaskEither<DB.DatabaseError, DB.Connection> =>
  pipe(
    TE.tryCatch(async () => {
      const client = new PostgresClient(postgresConnectionConfig);
      await client.connect();
      return client;
    }, toConnectionError('Unknown error')),
    TE.map(postgresClientToConnection(engineConfig))
  );

const createPool = (
  postgresConnectionConfig: PostgresConnectionConfig,
  engineConfig: PostgresEngineConfig
): DB.Pool =>
  pipe(
    new PostgresPool(postgresConnectionConfig),
    postgresPoolToPool(engineConfig)
  );

const postgresClientToConnection =
  (engineConfig: PostgresEngineConfig) =>
  (postgresClient: PostgresClient): DB.Connection =>
    pipe(postgresClient, client => ({
      query: query => pipe(client, queryOnPostgresClient(query, engineConfig)),
      close: clientToCloseFn(client),
      beginTransaction: () => beginTransaction(client, engineConfig),
      commitTransaction: () => commitTransaction(client, engineConfig),
      rollbackTransaction: () => rollbackTransaction(client, engineConfig),
    }));

// TODO: implement
const postgresPoolToPool =
  (engineConfig: PostgresEngineConfig) =>
  (postgresPool: PostgresPool): DB.Pool =>
    pipe([postgresPool, engineConfig], hole());

// Querying

const queryOnPostgresClient =
  (query: string, engineConfig: PostgresEngineConfig) =>
  (client: PostgresClient): ReturnType<DB.Connection['query']> =>
    pipe(
      TE.tryCatch(() => client.query(query), toQueryError),
      TE.chainFirstIOK(() =>
        engineConfig.echo ? CO.log(`Query "${query}" run.`) : IO.of(undefined)
      ),
      TE.map(toResult)
    );

const queryAndReturnVoid =
  (query: string) =>
  (
    postgresClient: PostgresClient,
    engineConfig: PostgresEngineConfig
  ): TE.TaskEither<DB.DatabaseError, void> =>
    pipe(
      postgresClient,
      queryOnPostgresClient(query, engineConfig),
      TE.map(() => undefined)
    );

const beginTransaction = queryAndReturnVoid('BEGIN;');
const commitTransaction = queryAndReturnVoid('COMMIT;');
const rollbackTransaction = queryAndReturnVoid('ROLLBACK;');

// Result object conversion

const toResult = (postgresResult: PostgresResult<any>): DB.Result =>
  postgresResult;

const clientToCloseFn =
  (client: PostgresClient): DB.Connection['close'] =>
  () =>
    TE.tryCatch(() => client.end(), toCloseError);
