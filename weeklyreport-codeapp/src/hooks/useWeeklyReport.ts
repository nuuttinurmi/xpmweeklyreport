// ============================================================
// useWeeklyReport
// Orchestrates all data fetching for the ReportEditor page.
// Report entity: pum_statusreporting (existing xPM table)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type {
  PumStatusReporting,
  PumChangeRequest,
  PumRisk,
  EcrProjectPortfolio2,
  StaffingRow,
  ScheduleCell,
} from "../types/dataverse";
import {
  fetchStatusReport,
  fetchGanttTasksWithStaffing,
  fetchAllGanttTasks,
  fetchChangeRequests,
  fetchRisks,
  fetchProjectByNumber,
  updateStatusReport,
} from "../utils/dataverseClient";
import { aggregateStaffing } from "../utils/staffingAggregator";
import {
  getISOWeek,
  getMondayOfISOWeek,
  getFridayOfISOWeek,
  toISODateString,
  buildScheduleColumns,
  buildTaskDayMask,
  deriveArea,
  stripAreaFromName,
} from "../utils/weekUtils";

interface UseWeeklyReportResult {
  loading: boolean;
  error: string | null;

  // Raw report data
  report: PumStatusReporting | null;
  project: EcrProjectPortfolio2 | null;

  // Derived / composed data
  staffing: StaffingRow[];
  scheduleCells: ScheduleCell[];
  scheduleColumns: ReturnType<typeof buildScheduleColumns>;
  changes: PumChangeRequest[];
  risks: PumRisk[];

  // Edit handlers
  updateField: (field: keyof PumStatusReporting, value: string | number) => void;
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

  const [report, setReport] = useState<PumStatusReporting | null>(null);
  const [project, setProject] = useState<EcrProjectPortfolio2 | null>(null);
  const [staffing, setStaffing] = useState<StaffingRow[]>([]);
  const [scheduleCells, setScheduleCells] = useState<ScheduleCell[]>([]);
  const [scheduleColumns, setScheduleColumns] = useState<ReturnType<typeof buildScheduleColumns>>(
    buildScheduleColumns(1, 2026)
  );
  const [changes, setChanges] = useState<PumChangeRequest[]>([]);
  const [risks, setRisks] = useState<PumRisk[]>([]);

  useEffect(() => {
    if (!reportId || !initiativeId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, initiativeId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch the status report
      const rep = await fetchStatusReport(reportId);
      if (!rep) throw new Error("Report not found");
      setReport(rep);

      // 2. Derive week/year from statusdate
      const statusDate = rep.pum_statusdate
        ? new Date(rep.pum_statusdate)
        : new Date();
      const { week, year } = getISOWeek(statusDate);
      const monday = getMondayOfISOWeek(week, year);
      const friday = getFridayOfISOWeek(week, year);
      const weekStart = toISODateString(monday);
      const weekEnd = toISODateString(friday);

      // Grid covers N-1 to N+1
      const gridStart = toISODateString(getMondayOfISOWeek(week - 1, year));
      const gridEnd = toISODateString(getFridayOfISOWeek(week + 1, year));

      const cols = buildScheduleColumns(week, year);
      setScheduleColumns(cols);

      // 3. Parallel fetches
      const [staffingTasks, allTasks, crs, rsks] = await Promise.all([
        fetchGanttTasksWithStaffing(initiativeId, weekStart, weekEnd),
        fetchAllGanttTasks(initiativeId, gridStart, gridEnd),
        fetchChangeRequests(initiativeId),
        fetchRisks(initiativeId),
      ]);

      // 4. Staffing
      setStaffing(aggregateStaffing(staffingTasks, weekStart, weekEnd));

      // 5. Schedule cells
      const cells: ScheduleCell[] = allTasks.map((t) => ({
        taskId: t.pum_gantttaskid,
        taskName: stripAreaFromName(t.pum_name),
        area: deriveArea(t.pum_name, t.pum_wbs),
        days: buildTaskDayMask(t.pum_startdate, t.pum_enddate, cols.days),
      }));
      setScheduleCells(cells);

      // 6. Changes + risks
      setChanges(crs);
      setRisks(rsks);

      // 7. Project info — pum_statusreporting doesn't expand initiative,
      //    so use initiativeId to look up via pum_initiative → ecr_projectportfolio2.
      //    For now leave project null until we have that join path confirmed.
      setProject(null);

      void fetchProjectByNumber; // unused until initiative→project link is confirmed
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const updateField = useCallback(
    (field: keyof PumStatusReporting, value: string | number) => {
      setReport((prev) => (prev ? { ...prev, [field]: value } : prev));
      setDirty(true);
    },
    []
  );

  const save = useCallback(async () => {
    if (!report?.pum_statusreportingid) return;
    setSaving(true);
    try {
      await updateStatusReport(report.pum_statusreportingid, {
        pum_comment: report.pum_comment,
        pum_statuscategory: report.pum_statuscategory,
        pum_kpinewresources: report.pum_kpinewresources,
        pum_kpinewsummary: report.pum_kpinewsummary,
        pum_kpinewquality: report.pum_kpinewquality,
        pum_kpinewcost: report.pum_kpinewcost,
        pum_kpinewscope: report.pum_kpinewscope,
        pum_kpinewschedule: report.pum_kpinewschedule,
        pum_kpinewresourcescomment: report.pum_kpinewresourcescomment,
        pum_kpinewqualitycomment: report.pum_kpinewqualitycomment,
        pum_kpinewcostcomment: report.pum_kpinewcostcomment,
        pum_kpinewscopecomment: report.pum_kpinewscopecomment,
        pum_kpinewschedulecomment: report.pum_kpinewschedulecomment,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [report]);

  return {
    loading,
    error,
    report,
    project,
    staffing,
    scheduleCells,
    scheduleColumns,
    changes,
    risks,
    updateField,
    save,
    saving,
    dirty,
  };
}
