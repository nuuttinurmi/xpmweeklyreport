// ============================================================
// Dataverse service client
//
// Uses Power Apps SDK Connection References (generated services)
// for all data access. Authentication is handled entirely by the
// Power Apps runtime — no MSAL, no bearer tokens, no redirect URIs.
// ============================================================

import {
  Pum_initiativesService,
  Pum_gantttasksService,
  Pum_assignmentsService,
  Pum_resourcesService,
  Pum_changerequestsService,
  Pum_risksService,
  Pum_statusreportingsService,
} from "../generated";
import type {
  PumInitiative,
  PumGanttTask,
  PumChangeRequest,
  PumRisk,
  PumStatusReporting,
} from "../types/dataverse";

// ── Assignment rows (flat) ───────────────────────────────────

export interface AssignmentRow {
  pum_assignmentid: string;
  taskId: string;
  resourceName: string;
  taskName: string;
  plannedHours: number;
  actualHours: number;
}

export async function fetchAssignmentsForInitiative(
  initiativeId: string
): Promise<AssignmentRow[]> {
  const result = await Pum_assignmentsService.getAll({
    filter: `_pum_initiative_value eq '${initiativeId}' and statecode eq 0`,
    select: [
      "pum_assignmentid",
      "_pum_asstask_value",
      "_pum_resource_value",
      "pum_taskname",
      "pum_assignmentwork",
      "pum_assignmentactualwork",
    ],
  });
  return (result.data ?? []).map((r) => ({
    pum_assignmentid: r.pum_assignmentid,
    taskId: r._pum_asstask_value ?? "",
    // pum_resourcename is the denormalized display name returned with annotations
    resourceName: (r as unknown as Record<string, string>).pum_resourcename ?? "—",
    taskName: r.pum_taskname ?? "—",
    plannedHours: Number(r.pum_assignmentwork ?? 0),
    actualHours: Number(r.pum_assignmentactualwork ?? 0),
  }));
}

// ── Assignments with resource + role (for staffing) ──────────

export interface StaffingAssignment {
  pum_assignmentid: string;
  taskId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  roleName: string;
}

export async function fetchAssignmentsWithRoles(
  initiativeId: string
): Promise<StaffingAssignment[]> {
  // Step 1: get assignments
  const assignRes = await Pum_assignmentsService.getAll({
    filter: `_pum_initiative_value eq '${initiativeId}' and statecode eq 0`,
    select: ["pum_assignmentid", "_pum_asstask_value", "_pum_resource_value"],
  });
  const assignments = assignRes.data ?? [];

  // Step 2: collect unique resource IDs
  const resourceIds = [
    ...new Set(
      assignments
        .map((a) => a._pum_resource_value)
        .filter((id): id is string => !!id)
    ),
  ];

  // Step 3: fetch resource records (name, type, role name)
  const resourceMap = new Map<
    string,
    { name: string; type: string; roleName: string }
  >();
  if (resourceIds.length > 0) {
    const resFilter = resourceIds
      .map((id) => `pum_resourceid eq '${id}'`)
      .join(" or ");
    const resRes = await Pum_resourcesService.getAll({
      filter: resFilter,
      select: ["pum_resourceid", "pum_name", "pum_resourcetype", "_pum_role_value"],
    });
    for (const r of resRes.data ?? []) {
      resourceMap.set(r.pum_resourceid, {
        name: r.pum_name,
        // pum_resourcetype is a numeric option set key (e.g. 493840000 = Named)
        type: String(r.pum_resourcetype ?? ""),
        // pum_rolename is the display name of the Role lookup, returned with annotations
        roleName: (r as unknown as Record<string, string>).pum_rolename ?? "Muu",
      });
    }
  }

  // Step 4: join
  return assignments.map((a) => {
    const res = a._pum_resource_value
      ? resourceMap.get(a._pum_resource_value)
      : undefined;
    return {
      pum_assignmentid: a.pum_assignmentid,
      taskId: a._pum_asstask_value ?? "",
      resourceId: a._pum_resource_value ?? "",
      resourceName: res?.name ?? "—",
      resourceType: res?.type ?? "",
      roleName: res?.roleName ?? "Muu",
    };
  });
}

// ── Initiative with project type ─────────────────────────────

export async function fetchInitiativeWithType(
  initiativeId: string
): Promise<PumInitiative | null> {
  const result = await Pum_initiativesService.get(initiativeId, {
    select: [
      "pum_initiativeid",
      "pum_name",
      "pum_projecttype",
      "aud_projectno",
      "aud_customer",
      "pum_initiativestart",
      "pum_initiativefinish",
      // Include owner lookup so owneridname annotation is returned
      "_ownerid_value",
    ],
  });
  const r = result.data;
  if (!r) return null;
  return {
    pum_initiativeid: r.pum_initiativeid,
    pum_name: r.pum_name,
    // pum_projecttype is a numeric option set key — compatible with number
    pum_projecttype: r.pum_projecttype as unknown as number | undefined,
    aud_projectno: r.aud_projectno,
    aud_customer: r.aud_customer,
    pum_initiativestart: r.pum_initiativestart,
    pum_initiativefinish: r.pum_initiativefinish,
    // owneridname is the display name of the owner, returned with include-annotations=*
    ownerName: r.owneridname ?? undefined,
  };
}

// ── Initiatives ──────────────────────────────────────────────

export async function fetchInitiatives(search?: string): Promise<PumInitiative[]> {
  const filter = search
    ? `contains(pum_name,'${search.replace(/'/g, "''")}')`
    : undefined;
  const result = await Pum_initiativesService.getAll({
    select: ["pum_initiativeid", "pum_name"],
    filter,
    orderBy: ["pum_name asc"],
    top: 100,
  });
  return (result.data ?? []).map((r) => ({
    pum_initiativeid: r.pum_initiativeid,
    pum_name: r.pum_name,
  }));
}

// ── Gantt tasks ──────────────────────────────────────────────

export async function fetchGanttTasksWithStaffing(
  initiativeId: string,
  weekStart: string,
  weekEnd: string
): Promise<PumGanttTask[]> {
  const result = await Pum_gantttasksService.getAll({
    filter:
      `_pum_initiative_value eq '${initiativeId}'` +
      ` and pum_startdate le ${weekEnd}T23:59:59Z` +
      ` and pum_enddate ge ${weekStart}T00:00:00Z`,
    select: [
      "pum_gantttaskid",
      "pum_name",
      "pum_startdate",
      "pum_enddate",
      "pum_wbs",
      "pum_duration",
    ],
  });
  return (result.data ?? []) as unknown as PumGanttTask[];
}

export async function fetchAllGanttTasks(
  initiativeId: string,
  gridStart: string,
  gridEnd: string
): Promise<PumGanttTask[]> {
  const result = await Pum_gantttasksService.getAll({
    filter:
      `_pum_initiative_value eq '${initiativeId}'` +
      ` and pum_startdate le ${gridEnd}T23:59:59Z` +
      ` and pum_enddate ge ${gridStart}T00:00:00Z`,
    select: [
      "pum_gantttaskid",
      "pum_name",
      "pum_startdate",
      "pum_enddate",
      "pum_wbs",
      "pum_duration",
      "pum_tasktype",
    ],
    orderBy: ["pum_wbs asc"],
  });
  return (result.data ?? []) as unknown as PumGanttTask[];
}

// ── Change requests ──────────────────────────────────────────

export async function fetchChangeRequests(
  initiativeId: string
): Promise<PumChangeRequest[]> {
  const result = await Pum_changerequestsService.getAll({
    filter: `_pum_initiative_value eq '${initiativeId}'`,
    select: ["pum_changerequestid", "pum_name", "pum_description", "statuscode", "pum_approved", "pum_dateapproved"],
    orderBy: ["createdon desc"],
  });
  return (result.data ?? []) as unknown as PumChangeRequest[];
}

// ── Risks ────────────────────────────────────────────────────

export async function fetchRisks(initiativeId: string): Promise<PumRisk[]> {
  const result = await Pum_risksService.getAll({
    filter: `_pum_initiative_value eq '${initiativeId}' and statecode eq 0`,
    select: [
      "pum_riskid",
      "pum_name",
      "pum_riskdescription",
      "pum_riskimpact",
      "pum_probability",
      "pum_riskstatus",
    ],
    orderBy: ["pum_riskimpact desc"],
  });
  return (result.data ?? []) as unknown as PumRisk[];
}

// ── StatusReporting CRUD ─────────────────────────────────────

const STATUS_REPORT_FIELDS = [
  "pum_statusreportingid",
  "pum_statusdate",
  "pum_comment",
  "pum_statuscategory",
  "statecode",
  "pum_currentphase",
  "pum_scheduleprogress",
  "pum_actualcost",
  "pum_budget",
  "pum_kpicurrentresources",
  "pum_kpicurrentsummary",
  "pum_kpicurrentquality",
  "pum_kpicurrentcost",
  "pum_kpicurrentscope",
  "pum_kpicurrentschedule",
  "pum_kpinewresources",
  "pum_kpinewsummary",
  "pum_kpinewquality",
  "pum_kpinewcost",
  "pum_kpinewscope",
  "pum_kpinewschedule",
  "pum_kpinewresourcescomment",
  "pum_kpinewqualitycomment",
  "pum_kpinewcostcomment",
  "pum_kpinewscopecomment",
  "pum_kpinewschedulecomment",
  "_pum_initiative_value",
];

export async function fetchStatusReports(
  initiativeId: string
): Promise<PumStatusReporting[]> {
  const result = await Pum_statusreportingsService.getAll({
    filter: `_pum_initiative_value eq '${initiativeId}' and statecode eq 0`,
    select: STATUS_REPORT_FIELDS,
    orderBy: ["pum_statusdate desc"],
  });
  return (result.data ?? []) as unknown as PumStatusReporting[];
}

export async function fetchStatusReport(
  reportId: string
): Promise<PumStatusReporting | null> {
  const result = await Pum_statusreportingsService.get(reportId, {
    select: STATUS_REPORT_FIELDS,
  });
  return (result.data ?? null) as unknown as PumStatusReporting | null;
}

export async function createStatusReport(
  data: Partial<PumStatusReporting> & { "pum_Initiative@odata.bind": string }
): Promise<PumStatusReporting> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await Pum_statusreportingsService.create(data as any);
  return (result.data ?? {}) as unknown as PumStatusReporting;
}

export async function updateStatusReport(
  reportId: string,
  data: Partial<PumStatusReporting>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Pum_statusreportingsService.update(reportId, data as any);
}
