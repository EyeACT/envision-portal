type RemovedRow = { deleted: true; id: string };

/**
 * Sorts the rows from a form save by what needs to happen to each one.
 * Pairs with `editableRows`, which only checks the id of a row being removed.
 */
export function splitRows<T extends { deleted?: boolean; id?: string }>(
  rows: (RemovedRow | T)[],
) {
  const activeRows = rows.filter((row) => !row.deleted) as T[];

  return {
    toCreate: activeRows.filter((row) => !row.id),
    toDelete: rows.filter(
      (row): row is RemovedRow => row.deleted === true && !!row.id,
    ),
    toUpdate: activeRows.filter((row) => row.id) as (T & { id: string })[],
  };
}
