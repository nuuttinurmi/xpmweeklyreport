// ============================================================
// Dataverse entity types
// These mirror the generated models from `pac code add-data-source`
// but are hand-authored here so the app compiles before running the CLI.
// After running setup.md CLI commands, replace with imports from
// src/generated/models/*.ts
// ============================================================

// ── xPM tables ──────────────────────────────────────────────

export interface PumInitiative {
  pum_initiativeid: string;
  pum_name: string;
  pum_initiativestart?: string;
  pum_initiativefinish?: string;
  pum_projecttype?: number; // 493840000 = Small, 493840002 = Large
  aud_projectno?: string;   // Audico custom: project number (join key to ecr_projectportfolio2)
  aud_customer?: string;    // Audico custom: customer name
  ownerName?: string;       // resolved from _ownerid_value formatted annotation
}

export const PROJECT_TYPE_SMALL = 493840000;
export const PROJECT_TYPE_LARGE = 493840002;

export interface PumGanttTask {
  pum_gantttaskid: string;
  pum_name: string;
  pum_startdate?: string;
  pum_enddate?: string;
  pum_duration?: number;
  pum_wbs?: string;
  pum_tasktype?: string;
  // computed fields (OData aggregates or calculated client-side)
  work?: number;         // planned hours
  actualwork?: number;   // actual hours
  remainingwork?: number;
  // expand
  pum_initiative_pum_gantttask?: PumInitiative;
  pum_assignment_gantttask?: PumAssignment[];
}

export interface PumAssignment {
  pum_assignmentid: string;
  pum_resource?: PumResource;
  pum_resourceid?: string;
  pum_gantttaskid?: string;
}

export interface PumResource {
  pum_resourceid: string;
  pum_name: string;
  pum_resourcetype?: string; // "Named" | "Generic"
  pum_role?: PumRole;
  pum_roleid?: string;
}

export interface PumRole {
  pum_roleid: string;
  pum_name: string;
}

export interface PumChangeRequest {
  pum_changerequestid: string;
  pum_name: string;
  pum_description?: string;
  statuscode?: number;
  statuscode_label?: string;
  pum_approved?: boolean;
  pum_dateapproved?: string;
  pum_initiativeid?: string;
}

export interface PumRisk {
  pum_riskid: string;
  pum_name: string;
  pum_riskdescription?: string;
  pum_riskimpact?: number;   // option set, e.g. 976880001 = "2 - Low"
  pum_probability?: number;  // option set, e.g. 976880003 = "60%"
  pum_riskstatus?: number;   // option set, e.g. 493840000 = "Identified"
  _pum_initiative_value?: string;
  statecode?: number;        // 0 = active
}

// ── Dynamics 365 tables ─────────────────────────────────────

export interface EcrProjectPortfolio2 {
  ecr_projectportfolio2id: string;
  ecr_projectnumber?: string;
  ecr_name: string;
  ecr_projectmanager?: string;
  ecr_customerid?: string;
  ecr_contactid?: string;
  aud_agreement?: string; // "Fixed Price" | "Time and Material"
  ecr_startdate?: string;
  ecr_enddate?: string;
  // expand
  ecr_customerid_account?: { name: string };
  ecr_contactid_contact?: { fullname: string };
}

// ── xPM status reporting ─────────────────────────────────────

/** KPI traffic-light option set value (493840000 = Not Set) */
export type KpiValue = number;

export interface PumStatusReporting {
  pum_statusreportingid: string;
  pum_statusdate?: string;           // ISO date, e.g. "2026-03-05T00:00:00Z"
  pum_comment?: string;              // main PM free-text
  pum_statuscategory?: number;       // option set
  statecode?: number;                // 0 = active, 1 = inactive
  pum_currentphase?: string;         // e.g. "1. Initiate"
  pum_scheduleprogress?: number;     // 0–100
  pum_actualcost?: number;
  pum_budget?: number;
  // KPI current (read-only, xPM-managed)
  pum_kpicurrentresources?: KpiValue;
  pum_kpicurrentsummary?: KpiValue;
  pum_kpicurrentquality?: KpiValue;
  pum_kpicurrentcost?: KpiValue;
  pum_kpicurrentscope?: KpiValue;
  pum_kpicurrentschedule?: KpiValue;
  // KPI new (PM-editable proposals)
  pum_kpinewresources?: KpiValue;
  pum_kpinewsummary?: KpiValue;
  pum_kpinewquality?: KpiValue;
  pum_kpinewcost?: KpiValue;
  pum_kpinewscope?: KpiValue;
  pum_kpinewschedule?: KpiValue;
  pum_kpinewresourcescomment?: string;
  pum_kpinewqualitycomment?: string;
  pum_kpinewcostcomment?: string;
  pum_kpinewscopecomment?: string;
  pum_kpinewschedulecomment?: string;
  // lookup
  _pum_initiative_value?: string;
}

// ── New tables (aud_) ────────────────────────────────────────

export type ReportStatus = "Draft" | "Ready" | "Sent";

export interface AudWeeklyReport {
  aud_weeklyreportid?: string;
  aud_name?: string;
  aud_weeknumber: number;
  aud_year: number;
  aud_status: ReportStatus;
  aud_actionitems?: string;
  aud_safetynotes?: string;
  aud_situationsummary?: string;
  aud_additionalinfo?: string;
  aud_outputfileurl?: string;
  // lookup
  _aud_initiative_value?: string; // initiative ID
  aud_initiative?: PumInitiative;
}

export interface AudWeeklyReportTaskNote {
  aud_weeklyreporttasknoteid?: string;
  aud_notes?: string;
  // lookups
  _aud_weeklyreport_value?: string;
  _aud_gantttask_value?: string;
  aud_gantttask?: PumGanttTask;
}

// ── UI-only composite types ──────────────────────────────────

export interface StaffingRow {
  name: string;
  role: string;
}

export interface TaskStatusRow {
  taskId: string;
  taskName: string;
  area: string;
  completionPct: number;
  notes: string; // from AudWeeklyReportTaskNote
  noteId?: string;
}

export interface ScheduleCell {
  taskId: string;
  taskName: string;
  area: string;
  days: boolean[]; // [Mo,Tu,We,Th,Fr] × 3 weeks = 15 booleans
}

export interface WeekDay {
  isoDate: string; // "2026-03-02"
  label: string;   // "Ma"
  weekNumber: number;
}
