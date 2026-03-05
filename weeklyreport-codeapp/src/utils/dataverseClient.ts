// ============================================================
// Dataverse OData client
//
// The Code Apps SDK generated services support single-table CRUD
// and basic expand, but deep multi-hop queries
// (gantttask → assignment → resource → role) require raw OData.
//
// This module wraps fetch() using the environment base URL from
// power.config.json, and the bearer token managed by the SDK host.
//
// The SDK exposes the current auth token via:
//   import { PowerApps } from "@microsoft/power-apps";
//   const token = await PowerApps.getAccessToken();
// ============================================================

import type {
  PumInitiative,
  PumGanttTask,
  PumChangeRequest,
  PumRisk,
  EcrProjectPortfolio2,
  AudWeeklyReport,
  AudWeeklyReportTaskNote,
} from "../types/dataverse";

// Injected at init time from power.config.json / SDK
let _baseUrl = ""; // e.g. "https://org.crm.dynamics.com"
let _getToken: () => Promise<string> = async () => "";

export function initDataverseClient(
  baseUrl: string,
  getToken: () => Promise<string>
) {
  _baseUrl = baseUrl.replace(/\/$/, "");
  _getToken = getToken;
}

async function dvFetch<T>(path: string): Promise<T[]> {
  const token = await _getToken();
  const url = `${_baseUrl}/api/data/v9.2/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Prefer: "odata.include-annotations=OData.Community.Display.V1.FormattedValue",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dataverse OData error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.value ?? [];
}

async function dvPost<T>(path: string, body: object): Promise<T> {
  const token = await _getToken();
  const url = `${_baseUrl}/api/data/v9.2/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Dataverse POST error ${res.status}: ${text}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

async function dvPatch(path: string, body: object): Promise<void> {
  const token = await _getToken();
  const url = `${_baseUrl}/api/data/v9.2/${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dataverse PATCH error ${res.status}: ${text}`);
  }
}

// ── Assignment rows (flat, no expand needed) ─────────────────

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
  const filter = `$filter=_pum_initiative_value eq ${initiativeId} and statecode eq 0`;
  const select =
    "$select=pum_assignmentid,_pum_asstask_value,_pum_resource_value,pum_taskname,pum_assignmentwork,pum_assignmentactualwork";
  const raw = await dvFetch<Record<string, unknown>>(
    `pum_assignments?${select}&${filter}`
  );
  return raw.map((r) => ({
    pum_assignmentid: r.pum_assignmentid as string,
    taskId: (r["_pum_asstask_value"] as string) ?? "",
    resourceName:
      (r["_pum_resource_value@OData.Community.Display.V1.FormattedValue"] as string) ?? "—",
    taskName: (r.pum_taskname as string) ?? "—",
    plannedHours: (r.pum_assignmentwork as number) ?? 0,
    actualHours: (r.pum_assignmentactualwork as number) ?? 0,
  }));
}

// ── Initiatives ──────────────────────────────────────────────

export async function fetchInitiatives(search?: string): Promise<PumInitiative[]> {
  let filter = "";
  if (search) {
    const escaped = search.replace(/'/g, "''");
    filter = `&$filter=contains(pum_name,'${escaped}')`;
  }
  const select = "$select=pum_initiativeid,pum_name";
  return dvFetch<PumInitiative>(`pum_initiatives?${select}${filter}&$orderby=pum_name asc&$top=100`);
}

// ── Project portfolio (Dynamics) ─────────────────────────────

export async function fetchProjectByNumber(
  projectNumber: string
): Promise<EcrProjectPortfolio2 | null> {
  const escaped = projectNumber.replace(/'/g, "''");
  const select = "$select=ecr_projectportfolio2id,ecr_projectnumber,ecr_name,ecr_projectmanager,aud_agreement,ecr_startdate,ecr_enddate";
  const expand = "$expand=ecr_customerid_account($select=name),ecr_contactid_contact($select=fullname)";
  const filter = `$filter=ecr_projectnumber eq '${escaped}'`;
  const results = await dvFetch<EcrProjectPortfolio2>(
    `ecr_projectportfolio2s?${select}&${expand}&${filter}&$top=1`
  );
  return results[0] ?? null;
}

// ── Gantt tasks with full expand chain ──────────────────────

export async function fetchGanttTasksWithStaffing(
  initiativeId: string,
  weekStart: string,
  weekEnd: string
): Promise<PumGanttTask[]> {
  // Date filter: tasks that overlap the target week
  const filter = `$filter=_pum_initiative_value eq ${initiativeId} and pum_startdate le ${weekEnd}T23:59:59Z and pum_enddate ge ${weekStart}T00:00:00Z`;
  const select = "$select=pum_gantttaskid,pum_name,pum_startdate,pum_enddate,pum_wbs,pum_duration";
  // Assignment expand disabled until navigation property names are confirmed
  return dvFetch<PumGanttTask>(`pum_gantttasks?${select}&${filter}`);
}

/** Fetch all tasks for an initiative (for schedule grid, task status) */
export async function fetchAllGanttTasks(
  initiativeId: string,
  gridStart: string,
  gridEnd: string
): Promise<PumGanttTask[]> {
  const filter = `$filter=_pum_initiative_value eq ${initiativeId} and pum_startdate le ${gridEnd}T23:59:59Z and pum_enddate ge ${gridStart}T00:00:00Z`;
  const select = "$select=pum_gantttaskid,pum_name,pum_startdate,pum_enddate,pum_wbs,pum_duration,pum_tasktype";
  return dvFetch<PumGanttTask>(`pum_gantttasks?${select}&${filter}&$orderby=pum_wbs asc`);
}

/** Fetch tasks with Work/ActualWork for completion % */
export async function fetchTasksWithWork(
  initiativeId: string
): Promise<PumGanttTask[]> {
  const filter = `$filter=_pum_initiative_value eq ${initiativeId} and statecode eq 0`;
  const select = "$select=pum_gantttaskid,pum_name,pum_wbs,pum_startdate,pum_enddate,pum_tasktype";
  // Note: Work/ActualWork field names may vary per xPM version — confirm with pac code list-tables
  return dvFetch<PumGanttTask>(`pum_gantttasks?${select}&${filter}&$orderby=pum_wbs asc`);
}

// ── Change requests ──────────────────────────────────────────

export async function fetchChangeRequests(
  initiativeId: string
): Promise<PumChangeRequest[]> {
  const filter = `$filter=_pum_initiative_value eq ${initiativeId}`;
  const select = "$select=pum_changerequestid,pum_name,pum_description,statuscode";
  return dvFetch<PumChangeRequest>(`pum_changerequests?${select}&${filter}&$orderby=createdon desc`);
}

// ── Risks ────────────────────────────────────────────────────

export async function fetchRisks(initiativeId: string): Promise<PumRisk[]> {
  const filter = `$filter=_pum_initiative_value eq ${initiativeId} and statecode eq 0`;
  const select = "$select=pum_riskid,pum_name,pum_description,pum_impact,pum_probability";
  return dvFetch<PumRisk>(`pum_risks?${select}&${filter}&$orderby=pum_impact desc`);
}

// ── WeeklyReport CRUD ────────────────────────────────────────

export async function fetchWeeklyReports(
  initiativeId: string
): Promise<AudWeeklyReport[]> {
  const filter = `$filter=_aud_initiative_value eq ${initiativeId}`;
  const select = "$select=aud_weeklyreportid,aud_weeknumber,aud_year,aud_status,aud_outputfileurl,createdon";
  return dvFetch<AudWeeklyReport>(
    `aud_weeklyreports?${select}&${filter}&$orderby=aud_year desc,aud_weeknumber desc`
  );
}

export async function fetchWeeklyReport(
  reportId: string
): Promise<AudWeeklyReport | null> {
  const select = "$select=aud_weeklyreportid,aud_weeknumber,aud_year,aud_status,aud_actionitems,aud_safetynotes,aud_situationsummary,aud_additionalinfo,aud_outputfileurl";
  const results = await dvFetch<AudWeeklyReport>(
    `aud_weeklyreports(${reportId})?${select}`
  );
  // Single record endpoint returns object, not array — handle both
  return (results as unknown as AudWeeklyReport) ?? null;
}

export async function createWeeklyReport(
  data: Omit<AudWeeklyReport, "aud_weeklyreportid">
): Promise<AudWeeklyReport> {
  return dvPost<AudWeeklyReport>("aud_weeklyreports", data);
}

export async function updateWeeklyReport(
  reportId: string,
  data: Partial<AudWeeklyReport>
): Promise<void> {
  return dvPatch(`aud_weeklyreports(${reportId})`, data);
}

// ── TaskNotes CRUD ────────────────────────────────────────────

export async function fetchTaskNotes(
  reportId: string
): Promise<AudWeeklyReportTaskNote[]> {
  const filter = `$filter=_aud_weeklyreport_value eq ${reportId}`;
  const select = "$select=aud_weeklyreporttasknoteid,aud_notes,_aud_gantttask_value";
  const expand = "$expand=aud_gantttask($select=pum_gantttaskid,pum_name,pum_wbs)";
  return dvFetch<AudWeeklyReportTaskNote>(
    `aud_weeklyreporttasknotes?${select}&${filter}&${expand}`
  );
}

export async function upsertTaskNote(
  noteId: string | undefined,
  reportId: string,
  taskId: string,
  notes: string
): Promise<void> {
  const body: Record<string, unknown> = {
    aud_notes: notes,
    "aud_weeklyreport@odata.bind": `/aud_weeklyreports(${reportId})`,
    "aud_gantttask@odata.bind": `/pum_gantttasks(${taskId})`,
  };
  if (noteId) {
    await dvPatch(`aud_weeklyreporttasknotes(${noteId})`, { aud_notes: notes });
  } else {
    await dvPost("aud_weeklyreporttasknotes", body);
  }
}
