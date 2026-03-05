// ============================================================
// useWeeklyReport
// Orchestrates all data fetching for the ReportEditor page.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type {
  AudWeeklyReport,
  AudWeeklyReportTaskNote,
  PumGanttTask,
  PumChangeRequest,
  PumRisk,
  EcrProjectPortfolio2,
  StaffingRow,
  TaskStatusRow,
  ScheduleCell,
} from "../types/dataverse";
import {
  fetchWeeklyReport,
  fetchTaskNotes,
  fetchGanttTasksWithStaffing,
  fetchAllGanttTasks,
  fetchTasksWithWork,
  fetchChangeRequests,
  fetchRisks,
  fetchProjectByNumber,
  updateWeeklyReport,
  upsertTaskNote,
} from "../utils/dataverseClient";
import { aggregateStaffing } from "../utils/staffingAggregator";
import {
  getMondayOfISOWeek,
  getFridayOfISOWeek,
  toISODateString,
  buildScheduleColumns,
  buildTaskDayMask,
  deriveArea,
  stripAreaFromName,
  calcCompletion,
} from "../utils/weekUtils";

interface UseWeeklyReportResult {
  loading: boolean;
  error: string | null;

  // Raw report data
  report: AudWeeklyReport | null;
  project: EcrProjectPortfolio2 | null;

  // Derived / composed data
  staffing: StaffingRow[];
  taskRows: TaskStatusRow[];
  scheduleCells: ScheduleCell[];
  scheduleColumns: ReturnType<typeof buildScheduleColumns>;
  changes: PumChangeRequest[];
  risks: PumRisk[];

  // Edit handlers
  updateField: (field: keyof AudWeeklyReport, value: string) => void;
  updateTaskNote: (taskId: string, noteId: string | undefined, notes: string) => void;
  save: () => Promise<void>;
  saving: boolean;
  dirty: boolean;
}

export function useWeeklyReport(
  reportId: string,
  initiativeId: string
): UseWeeklyReportResult {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [report, setReport] = useState<AudWeeklyReport | null>(null);
  const [project, setProject] = useState<EcrProjectPortfolio2 | null>(null);
  const [staffing, setStaffing] = useState<StaffingRow[]>([]);
  const [taskRows, setTaskRows] = useState<TaskStatusRow[]>([]);
  const [scheduleCells, setScheduleCells] = useState<ScheduleCell[]>([]);
  const [scheduleColumns, setScheduleColumns] = useState<ReturnType<typeof buildScheduleColumns>>(
    buildScheduleColumns(1, 2026)
  );
  const [changes, setChanges] = useState<PumChangeRequest[]>([]);
  const [risks, setRisks] = useState<PumRisk[]>([]);
  const [taskNoteMap, setTaskNoteMap] = useState<Map<string, AudWeeklyReportTaskNote>>(new Map());

  useEffect(() => {
    if (!reportId || !initiativeId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, initiativeId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch the report itself
      const rep = await fetchWeeklyReport(reportId);
      if (!rep) throw new Error("Raporttia ei löydy");
      setReport(rep);

      const { aud_weeknumber: week, aud_year: year } = rep;
      const monday = getMondayOfISOWeek(week, year);
      const friday = getFridayOfISOWeek(week, year);
      const weekStart = toISODateString(monday);
      const weekEnd = toISODateString(friday);

      // Grid covers N-1 to N+1: Monday of week-1 to Friday of week+1
      const gridStart = toISODateString(getMondayOfISOWeek(week - 1, year));
      const gridEnd = toISODateString(getFridayOfISOWeek(week + 1, year));

      const cols = buildScheduleColumns(week, year);
      setScheduleColumns(cols);

      // 2. Parallel fetches
      const [staffingTasks, allTasks, workTasks, taskNotes, crs, rsks] =
        await Promise.all([
          fetchGanttTasksWithStaffing(initiativeId, weekStart, weekEnd),
          fetchAllGanttTasks(initiativeId, gridStart, gridEnd),
          fetchTasksWithWork(initiativeId),
          fetchTaskNotes(reportId),
          fetchChangeRequests(initiativeId),
          fetchRisks(initiativeId),
        ]);

      // 3. Staffing
      setStaffing(aggregateStaffing(staffingTasks, weekStart, weekEnd));

      // 4. Task notes map (taskId → note)
      const noteMap = new Map<string, AudWeeklyReportTaskNote>();
      for (const note of taskNotes) {
        if (note._aud_gantttask_value) {
          noteMap.set(note._aud_gantttask_value, note);
        }
      }
      setTaskNoteMap(noteMap);

      // 5. Task status rows (use workTasks which have Work/ActualWork)
      // Join with noteMap for PM notes
      const workMap = new Map<string, PumGanttTask>();
      for (const t of workTasks) workMap.set(t.pum_gantttaskid, t);

      const rows: TaskStatusRow[] = workTasks.map((t) => {
        const note = noteMap.get(t.pum_gantttaskid);
        const area = deriveArea(t.pum_name, t.pum_wbs);
        return {
          taskId: t.pum_gantttaskid,
          taskName: stripAreaFromName(t.pum_name),
          area,
          completionPct: calcCompletion(t.work, t.actualwork),
          notes: note?.aud_notes ?? "",
          noteId: note?.aud_weeklyreporttasknoteid,
        };
      });
      setTaskRows(rows);

      // 6. Schedule cells
      const cells: ScheduleCell[] = allTasks.map((t) => ({
        taskId: t.pum_gantttaskid,
        taskName: stripAreaFromName(t.pum_name),
        area: deriveArea(t.pum_name, t.pum_wbs),
        days: buildTaskDayMask(t.pum_startdate, t.pum_enddate, cols.days),
      }));
      setScheduleCells(cells);

      // 7. Changes + risks
      setChanges(crs);
      setRisks(rsks);

      // 8. Project info (via project number on initiative)
      if (rep.aud_initiative?.pum_projectnumber) {
        const proj = await fetchProjectByNumber(rep.aud_initiative.pum_projectnumber);
        setProject(proj);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const updateField = useCallback(
    (field: keyof AudWeeklyReport, value: string) => {
      setReport((prev) => (prev ? { ...prev, [field]: value } : prev));
      setDirty(true);
    },
    []
  );

  const updateTaskNote = useCallback(
    (taskId: string, noteId: string | undefined, notes: string) => {
      setTaskRows((prev) =>
        prev.map((r) => (r.taskId === taskId ? { ...r, notes, noteId } : r))
      );
      setTaskNoteMap((prev) => {
        const updated = new Map(prev);
        const existing = prev.get(taskId);
        updated.set(taskId, {
          ...(existing ?? {}),
          aud_notes: notes,
          _aud_gantttask_value: taskId,
          aud_weeklyreporttasknoteid: noteId,
        });
        return updated;
      });
      setDirty(true);
    },
    []
  );

  const save = useCallback(async () => {
    if (!report?.aud_weeklyreportid) return;
    setSaving(true);
    try {
      // Save report fields
      await updateWeeklyReport(report.aud_weeklyreportid, {
        aud_actionitems: report.aud_actionitems,
        aud_safetynotes: report.aud_safetynotes,
        aud_situationsummary: report.aud_situationsummary,
        aud_additionalinfo: report.aud_additionalinfo,
        aud_status: report.aud_status,
      });

      // Save task notes
      const saves = taskRows
        .filter((r) => r.notes !== "")
        .map((r) =>
          upsertTaskNote(r.noteId, report.aud_weeklyreportid!, r.taskId, r.notes)
        );
      await Promise.all(saves);

      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [report, taskRows]);

  return {
    loading,
    error,
    report,
    project,
    staffing,
    taskRows,
    scheduleCells,
    scheduleColumns,
    changes,
    risks,
    updateField,
    updateTaskNote,
    save,
    saving,
    dirty,
  };
}
