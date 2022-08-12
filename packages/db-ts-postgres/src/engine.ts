import { pipe, hole } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as CO from 'fp-ts/Console';
import * as IO from 'fp-ts/IO';

import {
  ConnectionConfig,
  Client as PostgresClient,
  Pool as PostgresPool,
  QueryResult as PostgresQueryResult,
} from 'pg';

import * as DB from 'db-ts';

import { toConnectionError, toQueryError } from './error';

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
  createConnection: () =>
    pipe(
      createClient(connectionConfig),
      postgresClientToConnection(engineConfig)
    ),
  createPool: () => createPool(connectionConfig, engineConfig),
});

const createClient = (postgresConnectionConfig: PostgresConnectionConfig) =>
  new PostgresClient(postgresConnectionConfig);

const openConnection = (
  client: PostgresClient
): TE.TaskEither<DB.ConnectionError, PostgresClient> =>
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

    const connection: DB.Connection<DB.ConnectionNotOpened> = {
      _S: undefined as unknown as DB.ConnectionNotOpened,
      connect: () =>
        pipe(
          openConnection(postgresClient),
          TE.map(() => DB.unsafeConnectionTo(connection))
        ),
      close: () =>
        pipe(
          clientToCloseFn(postgresClient, DB.unsafeConnectionTo(connection)),
          TE.map(() => DB.unsafeConnectionTo(connection))
        ),
      query: (query: DB.Query) =>
        pipe(
          postgresClient,
          queryOnPostgresClient(query, engineConfig),
          TE.map(r => [r, DB.unsafeConnectionTo(connection)])
        ),
      beginTransaction: () =>
        pipe(
          beginTransaction(postgresClient, engineConfig),
          TE.map(() => DB.unsafeConnectionTo(connection))
        ),
      commitTransaction: () =>
        pipe(
          commitTransaction(postgresClient, engineConfig),
          TE.map(() => DB.unsafeConnectionTo(connection))
        ),
      rollbackTransaction: () =>
        pipe(
          rollbackTransaction(postgresClient, engineConfig),
          TE.map(() => DB.unsafeConnectionTo(connection))
        ),
    };

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
  ): TE.TaskEither<DB.UnexpectedDatabaseError, void> =>
    pipe(
      postgresClient,
      queryOnPostgresClient(query, engineConfig),
      TE.mapLeft(({ detail }) => DB.createUnexpectedDatabaseError(detail)),
      TE.map(() => undefined)
    );

const beginTransaction = queryAndReturnVoid('BEGIN;');
const commitTransaction = queryAndReturnVoid('COMMIT;');
const rollbackTransaction = queryAndReturnVoid('ROLLBACK;');

// Result object conversion

const toResult = (postgresResult: PostgresQueryResult<any>): DB.Result =>
  postgresResult as unknown as DB.Result;

const clientToCloseFn = (
  client: PostgresClient,
  connection: DB.Connection<DB.ConnectionOpened>
): TE.TaskEither<
  DB.UnexpectedDatabaseError,
  DB.Connection<DB.ConnectionNotOpened>
> =>
  pipe(
    TE.tryCatch(
      () => client.end(),
      e => DB.createUnexpectedDatabaseError(JSON.stringify(e))
    ),
    TE.map(() => connection as unknown as DB.Connection<DB.ConnectionNotOpened>)
  );
