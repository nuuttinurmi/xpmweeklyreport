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
  pum_expectedstartdate?: string;
  pum_expectedfinishdate?: string;
  pum_projectnumber?: string; // used as join key to ecr_projectportfolio2
}

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
  pum_initiativeid?: string;
}

export interface PumRisk {
  pum_riskid: string;
  pum_name: string;
  pum_description?: string;
  pum_impact?: number;       // 1–5
  pum_probability?: number;  // 0–100
  pum_initiativeid?: string;
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

// ── New tables (aud_) ────────────────────────────────────────

export type ReportStatus = "Luonnos" | "Valmis" | "Lähetetty";

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
  role: string;
  count: number;
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
