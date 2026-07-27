declare module "bun:sqlite" {
  export class Database {
    constructor(path: string, options?: { create?: boolean; readOnly?: boolean });
    query(sql: string): {
      all(...params: unknown[]): unknown[];
      get(...params: unknown[]): unknown;
      run(...params: unknown[]): void;
    };
    exec(sql: string): void;
  }
}
