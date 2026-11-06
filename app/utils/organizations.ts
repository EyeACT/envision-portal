import { normalizeROR } from "./validations";

type Organization = {
  identifier?: string | null;
  name?: string | null;
};

/**
 * Compares a form's organization with the same organization entered elsewhere.
 * @param current The organization in the form
 * @param source The organization to compare against and possibly copy from
 * @returns Whether copying from the source would change the form, and whether the two conflict
 */
export const compareOrganizations = (
  current: Organization,
  source: Organization,
) => {
  const currentName = current.name?.trim() ?? "";
  const sourceName = source.name?.trim() ?? "";
  const currentRor = normalizeROR(current.identifier ?? "");
  const sourceRor = normalizeROR(source.identifier ?? "");

  if (!sourceName) return { canPrefill: false, conflict: false };

  const namesMatch = currentName.toLowerCase() === sourceName.toLowerCase();
  const rorsMatch = currentRor === sourceRor;

  return {
    // A source without a ROR has nothing to add to a matching name.
    canPrefill: !namesMatch || (!!sourceRor && !rorsMatch),
    // An empty field isn't a disagreement, it's just not filled in yet.
    conflict:
      (!!currentName && !namesMatch) ||
      (!!currentRor && !!sourceRor && !rorsMatch),
  };
};
