// ============================================================
// Staffing aggregator
// Builds the "Vahvuus" table from assignments + week's task IDs
// ============================================================

import type { PumGanttTask, StaffingRow } from "../types/dataverse";
import type { StaffingAssignment } from "./dataverseClient";

/**
 * From a set of week's tasks and all initiative assignments (with role info),
 * list unique Named resources active during the report week.
 */
export function aggregateStaffing(
  weekTasks: PumGanttTask[],
  assignments: StaffingAssignment[]
): StaffingRow[] {
  const weekTaskIds = new Set(weekTasks.map((t) => t.pum_gantttaskid));

  // resourceId → { name, role } (deduplicate by person)
  const seen = new Map<string, StaffingRow>();

  for (const a of assignments) {
    if (!weekTaskIds.has(a.taskId)) continue;
    if (!a.resourceId) continue;
    const rt = String(a.resourceType).toLowerCase();
    if (rt === "generic" || rt === "493840001") continue;

    if (!seen.has(a.resourceId)) {
      seen.set(a.resourceId, { name: a.resourceName, role: a.roleName });
    }
  }

  const rows = Array.from(seen.values());
  rows.sort((a, b) => a.name.localeCompare(b.name, "fi"));
  return rows;
}
