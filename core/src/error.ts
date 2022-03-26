import { pipe } from "fp-ts/function";

export interface DatabaseError {
  type: string,
}

export interface ConnectionError extends DatabaseError {
  type: "ConnectionError",
};

export interface ConnectionCloseError extends DatabaseError {
  type: "ConnectionCloseError",
};

export interface QueryError extends DatabaseError {
  type: "QueryError",
};

export interface ResultOneError extends DatabaseError {
  type: "ResultOneError",
  detail: "MoreRowsReturned" | "NoRowReturned",
}

type DatabaseErrorFromType<T> = 
  T extends ConnectionError['type'] ? ConnectionError :
  T extends ConnectionCloseError['type'] ? ConnectionCloseError :
  T extends QueryError['type'] ? QueryError :
  T extends ResultOneError['type'] ? ResultOneError :
  unknown;

const createError = <T>(type: T): DatabaseErrorFromType<T> => 
  ({ type }) as DatabaseErrorFromType<T>

export const createConnectionError = createError("ConnectionError" as ConnectionError['type']);

export const createResultOneError =
  (detail: ResultOneError['detail']): ResultOneError =>
    pipe(
      "ResultOneError" as ResultOneError['type'],
      createError,
      (obj) => ({ ...obj, detail })
    )
