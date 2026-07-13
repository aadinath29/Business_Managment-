/**
 * Safely filters a list of branches using a search query query against name, location, manager, code, and status.
 * Defensively skips malformed branch objects, logs warnings, and performs null-safe operations.
 */
export function filterBranches(branches, searchQuery) {
  if (!Array.isArray(branches)) {
    console.warn("filterBranches: Input branches parameter is not a valid array.");
    return [];
  }

  const query = (searchQuery ?? '').toString().trim().toLowerCase();

  return branches.filter((b) => {
    // Audit core fields of branch
    if (!b || typeof b !== 'object' || !b.id) {
      console.warn("filterBranches: Malformed branch item detected and skipped:", b);
      return false;
    }

    if (!query) return true;

    // Defensively gather search target strings with null-safety and string conversions
    const name = (b.branchName ?? '').toString().toLowerCase();
    const code = (b.branchCode ?? '').toString().toLowerCase();
    const location = (b.companyLocation ?? b.city ?? '').toString().toLowerCase();
    const manager = (b.branchManager ?? b.manager ?? '').toString().toLowerCase();
    const status = (b.status ?? '').toString().toLowerCase();

    return name.includes(query) ||
           code.includes(query) ||
           location.includes(query) ||
           manager.includes(query) ||
           status.includes(query);
  });
}
