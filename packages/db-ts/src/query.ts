// now just proxy type to string
export type Query = string & { readonly Query: unique symbol };

export const sql =
  (strings: TemplateStringsArray, ...expr: string[]): Query => {
    const str = strings.reduce(
      (previous, current, i) => previous + current + (expr[i] || ''),
      '',
    );

    return str as Query;
  };
