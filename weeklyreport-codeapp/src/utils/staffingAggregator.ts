// ============================================================
// Staffing aggregator
// Builds the "Vahvuus" table from multi-hop Dataverse query result
// ============================================================

import type { PumGanttTask, StaffingRow } from "../types/dataverse";

/**
 * From a set of GanttTask records (with pum_assignment_gantttask expanded,
 * and each assignment with pum_resource and pum_role expanded),
 * compute unique Named resource counts per role.
 *
 * @param tasks       Array of pum_gantttask records with expanded assignments
 * @param weekStart   "YYYY-MM-DD" — Monday of report week
 * @param weekEnd     "YYYY-MM-DD" — Friday of report week
 */
export function aggregateStaffing(
  tasks: PumGanttTask[],
  weekStart: string,
  weekEnd: string
): StaffingRow[] {
  // Only tasks active during the target week
  const activeTasks = tasks.filter((t) => {
    if (!t.pum_startdate || !t.pum_enddate) return false;
    const ts = t.pum_startdate.slice(0, 10);
    const te = t.pum_enddate.slice(0, 10);
    return ts <= weekEnd && te >= weekStart;
  });

  // role → Set of unique resource IDs (Named only)
  const roleMap = new Map<string, Set<string>>();

  for (const task of activeTasks) {
    const assignments = task.pum_assignment_gantttask ?? [];
    for (const assignment of assignments) {
      const resource = assignment.pum_resource;
      if (!resource) continue;
      if (resource.pum_resourcetype === "Generic") continue; // skip placeholders

      const roleName = resource.pum_role?.pum_name ?? "Muu";
      if (!roleMap.has(roleName)) {
        roleMap.set(roleName, new Set());
      }
      roleMap.get(roleName)!.add(resource.pum_resourceid);
    }
  }

  const rows: StaffingRow[] = [];
  roleMap.forEach((ids, role) => {
    rows.push({ role, count: ids.size });
  });

  // Sort alphabetically by role name
  rows.sort((a, b) => a.role.localeCompare(b.role, "fi"));

  return rows;
}

/** Total headcount across all roles */
export function totalStaffing(rows: StaffingRow[]): number {
  return rows.reduce((sum, r) => sum + r.count, 0);
}
