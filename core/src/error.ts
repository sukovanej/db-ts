export type ConnectionError = {
  type: "ConnectionError",
  message: string,
};

export type ConnectionCloseError = {
  type: "ConnectionCloseError",
  message: string,
};

export type QueryError = {
  type: "ConnectionCloseError",
  message: string,
};

export type DatabaseError = 
  | ConnectionError
  | ConnectionCloseError
  | QueryError;

type DatabaseErrorFromType<T extends DatabaseError['type']> = 
  T extends ConnectionError['type'] ? ConnectionError :
  T extends ConnectionCloseError['type'] ? ConnectionCloseError :
  T extends QueryError['type'] ? QueryError :
  unknown;

const createError = 
  <T extends DatabaseError['type']>(type: T) =>
  (message: DatabaseError['message']): DatabaseErrorFromType<T> => ({ type, message }) as DatabaseErrorFromType<T>

export const createConnectionError = createError("ConnectionError");
