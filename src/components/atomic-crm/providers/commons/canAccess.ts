// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

/**
 * Role-based access control for Civilezy CRM.
 *
 * Roles:
 *   "admin"    — Santhosh, Dr. Anjana, Jasmine, Hima
 *                Full access to everything: HR dashboard, EMS, CRM.
 *
 *   "cre"      — CRM Executive
 *                Employee workspace (attendance, leave, tasks) + Student CRM.
 *                Cannot access HR admin tools or other employees' data.
 *
 *   "employee" — All other staff
 *                Employee workspace only. Cannot access CRM or admin tools.
 */
export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: string,
  params: CanAccessParams<RecordType>,
): boolean => {
  // Admins have unrestricted access
  if (role === "admin") return true;

  const { resource, action } = params;

  // ── Resources accessible to CRE only (not plain employees) ────────────────
  if (resource === "students") {
    // CREs can fully manage student leads
    if (role === "cre") return true;
    return false;
  }

  // ── Completely blocked for non-admins ──────────────────────────────────────
  const adminOnly = [
    "contacts",
    "companies",
    "contact_notes",
    "deal_notes",
    "deals",
    "tags",
    "sales",
    "configuration",
  ];
  if (adminOnly.includes(resource)) return false;

  // ── Employees — employees can only read their own record ──────────────────
  // list is allowed so that ReferenceInput/PunchCard can resolve the current
  // employee record (RLS limits results to the user's own row). The directory
  // page itself is not linked from the employee nav so it is effectively hidden.
  if (resource === "employees") {
    return action === "list" || action === "show";
  }

  // ── Attendance — submit own records, no delete ─────────────────────────────
  if (resource === "attendance") {
    return (
      action === "list" ||
      action === "show" ||
      action === "create" ||
      action === "edit"
    );
  }

  // ── Leaves — submit only, admin approves ──────────────────────────────────
  // Employees/CREs can submit (create) and view history (list/show).
  // Status changes (approve/reject) happen on edit — admin only.
  if (resource === "leaves") {
    return action === "list" || action === "show" || action === "create";
  }

  // ── Daily tasks — submit and update own entries, no delete ─────────────────
  if (resource === "daily_tasks") {
    return (
      action === "list" ||
      action === "show" ||
      action === "create" ||
      action === "edit"
    );
  }

  // Default deny for everything else
  return false;
};
