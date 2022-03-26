export interface Result {
  rows: any[],
  fields: { name: string, dataTypeId: string }[],
  command: string,
  rowCount: number,
}
