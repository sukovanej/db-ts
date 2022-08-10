import { pipe, hole } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

import {
  ConnectionConfig,
  Client as PostgresClient,
  Pool as PostgresPool,
  QueryResult as PostgresResult,
} from 'pg';

import * as DB from 'db-ts';

import { toCloseError, toConnectionError, toQueryError } from './error';

export type PostgresConnectionConfig = ConnectionConfig;

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
  connectionConfig: PostgresConnectionConfig,
  engineConfig: PostgresEngineConfig = defaultPostgresEngineConfig
): DB.Engine => ({
  createConnection: pipe(
    createClient(connectionConfig),
    postgresClientToConnection(engineConfig)
  ),
  createPool: () => createPool(connectionConfig, engineConfig),
});

const createClient = (postgresConnectionConfig: PostgresConnectionConfig) =>
  new PostgresClient(postgresConnectionConfig);

const openConnection = (client: PostgresClient) =>
  pipe(
    TE.tryCatch(async () => {
      await client.connect();
      return client;
    }, toConnectionError('Unknown error'))
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
  (postgresClient: PostgresClient): DB.Connection<DB.ConnectionNotOpened> => {
    // TODO: do better :(

    const connection = {
      connect: () => openConnection(postgresClient),
      close: () =>
        pipe(
          clientToCloseFn(postgresClient),
          TE.map(_ => connection)
        ),
      query: (query: DB.Query) =>
        pipe(
          postgresClient,
          queryOnPostgresClient(query, engineConfig),
          TE.map(r => [r, connection])
        ),
      beginTransaction: () =>
        pipe(
          beginTransaction(postgresClient, engineConfig),
          TE.map(a => [a, connection])
        ),
      commitTransaction: () =>
        pipe(
          commitTransaction(postgresClient, engineConfig),
          TE.map(a => [a, connection])
        ),
      rollbackTransaction: () =>
        pipe(
          rollbackTransaction(postgresClient, engineConfig),
          TE.map(a => [a, connection])
        ),
    } as unknown as DB.Connection<DB.ConnectionNotOpened>;

    return connection;
  };

// TODO: implement
const postgresPoolToPool =
  (engineConfig: PostgresEngineConfig) =>
  (postgresPool: PostgresPool): DB.Pool =>
    pipe([postgresPool, engineConfig], hole());

// Querying

const queryOnPostgresClient =
  (query: string, engineConfig: PostgresEngineConfig) =>
  (client: PostgresClient) =>
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

const clientToCloseFn = (client: PostgresClient) =>
  TE.tryCatch(() => client.end(), toCloseError);
