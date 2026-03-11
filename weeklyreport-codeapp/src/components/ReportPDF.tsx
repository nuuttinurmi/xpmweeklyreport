// Plain function — no JSX. Generates a PDF Blob using jsPDF + jspdf-autotable.
// No WebAssembly required, compatible with the Power Apps player CSP.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  PumStatusReporting,
  PumInitiative,
  StaffingRow,
  ScheduleCell,
  PumChangeRequest,
  PumRisk,
} from "../types/dataverse";
import type { buildScheduleColumns } from "../utils/weekUtils";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

// ── Colour helpers ─────────────────────────────────────────────

type RGB = [number, number, number];

function rgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const C = {
  black:       rgb("#282828"),
  darkGrey:    rgb("#3d3d3d"),
  midGrey1:    rgb("#797979"),
  midGrey3:    rgb("#dbdbdb"),
  lightGrey:   rgb("#f2f2f2"),
  accent:      rgb("#188c5b"),
  accentBg:    rgb("#e8f5ef"),
  statusInfo:  rgb("#1d5eaa"),
  statusError: rgb("#c4314b"),
  statusWarn:  rgb("#d4820c"),
  white:       rgb("#ffffff"),
};

// ── KPI helpers ────────────────────────────────────────────────

const KPI_MAP: Record<number, { prefix: string; key: "kpiNotSet" | "kpiNeedHelp" | "kpiAtRisk" | "kpiNoIssue"; color: RGB }> = {
  493840000: { prefix: "—",  key: "kpiNotSet",  color: C.midGrey1 },
  493840001: { prefix: "!",  key: "kpiNeedHelp", color: C.statusError },
  493840002: { prefix: "~",  key: "kpiAtRisk",  color: C.statusWarn },
  493840003: { prefix: "OK", key: "kpiNoIssue", color: C.accent },
};

function kpiText(val: number | undefined, lang: Lang): string {
  const entry = val != null ? KPI_MAP[val] : KPI_MAP[493840000];
  const e = entry ?? KPI_MAP[493840000];
  return `${e.prefix} ${t(e.key, lang)}`;
}

function kpiColor(val: number | undefined): RGB {
  const entry = val != null ? KPI_MAP[val] : undefined;
  return entry?.color ?? C.midGrey1;
}

const KPI_DIMS = [
  { key: "summary",   labelKey: "kpiSummary",   hasComment: false, isSummary: true  },
  { key: "resources", labelKey: "kpiResources", hasComment: true,  isSummary: false },
  { key: "quality",   labelKey: "kpiQuality",   hasComment: true,  isSummary: false },
  { key: "cost",      labelKey: "kpiCost",      hasComment: true,  isSummary: false },
  { key: "scope",     labelKey: "kpiScope",     hasComment: true,  isSummary: false },
  { key: "schedule",  labelKey: "kpiSchedule",  hasComment: true,  isSummary: false },
] as const;


// ── Option set labels ──────────────────────────────────────────

const IMPACT_LABELS: Record<number, string> = {
  976880000: "1 — Very Low",
  976880001: "2 — Low",
  976880002: "3 — Medium",
  976880003: "4 — High",
  976880004: "5 — Very High",
};
const PROBABILITY_LABELS: Record<number, string> = {
  976880000: "10 %",
  976880001: "30 %",
  976880002: "50 %",
  976880003: "70 %",
  976880004: "90 %",
};

// ── Drawing helpers ────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

/** Draw a section title (uppercase + underline) and return the new Y. */
function drawSectionTitle(doc: jsPDF, text: string, x: number, y: number, w: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.darkGrey);
  doc.text(text.toUpperCase(), x, y);
  doc.setDrawColor(...C.darkGrey);
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.5, x + w, y + 1.5);
  return y + 7;
}

/** Draw the PM comment box and return the new Y. */
function drawCommentBox(doc: jsPDF, text: string, x: number, y: number, w: number): number {
  const padding = 3;
  const minH = 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(text || "—", w - padding * 2);
  const boxH = Math.max(minH, lines.length * 4 + padding * 2);
  doc.setFillColor(...C.lightGrey);
  doc.setDrawColor(...C.midGrey3);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, boxH, "FD");
  doc.setTextColor(...C.black);
  doc.text(lines as string[], x + padding, y + padding + 3);
  return y + boxH + 4;
}

/** Return Y position after the last autoTable call. */
function afterTable(doc: jsPDF, fallback: number): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return (last?.finalY ?? fallback) + 5;
}

// ── Schedule grid column widths (mm, A4 usable ≈ 186mm) ───────
const COL_TASK = 46;
const COL_AREA = 18;
const COL_DAY  = 8.13; // 15 × 8.13 ≈ 122mm; total = 186mm

// ── Props ──────────────────────────────────────────────────────

export interface ReportPDFProps {
  report: PumStatusReporting;
  initiative: PumInitiative | null;
  staffing: StaffingRow[];
  scheduleCells: ScheduleCell[];
  scheduleColumns: ReturnType<typeof buildScheduleColumns>;
  changes: PumChangeRequest[];
  risks: PumRisk[];
  isLargeProject: boolean;
  lang: Lang;
  week: number;
  year: number;
  logoDataUrl?: string;
}

// ── Main export ────────────────────────────────────────────────

export function generateReportPdf(props: ReportPDFProps): Blob {
  const {
    report, initiative, staffing, scheduleCells, scheduleColumns,
    changes, risks, isLargeProject, lang, week, year, logoDataUrl,
  } = props;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 12;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;
  let y = margin;

  const { weeks, days } = scheduleColumns;
  const dayLabels = [t("mon", lang), t("tue", lang), t("wed", lang), t("thu", lang), t("fri", lang)];
  const activeCells = scheduleCells.filter((c) => c.days.some(Boolean));

  // ── Document header ──────────────────────────────────────────
  if (logoDataUrl) {
    const logoH = 9; // target height in mm
    const props = doc.getImageProperties(logoDataUrl);
    const logoW = logoH * (props.width / props.height); // preserve aspect ratio
    doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.black);
    doc.text("AUDICO", margin, y + 7);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.black);
  doc.text(t("reportTitle", lang), pageW / 2, y + 7, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.darkGrey);
  doc.text(`${t("wk", lang)} ${week}/${year}`, pageW - margin, y + 7, { align: "right" });
  y += 10;
  doc.setDrawColor(...C.black);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // ── Project information ──────────────────────────────────────
  y = drawSectionTitle(doc, t("projectInformation", lang), margin, y, contentW);
  const infoRows = [
    [t("date", lang),           fmtDate(report.pum_statusdate)],
    [t("projectNumber", lang),  initiative?.aud_projectno ?? "—"],
    [t("project", lang),        initiative?.pum_name ?? "—"],
    [t("client", lang),         initiative?.aud_customer ?? "—"],
    [t("projectManager", lang), initiative?.ownerName ?? "—"],
    [t("phase", lang),          report.pum_currentphase ?? "—"],
    [t("scheduleProgress", lang), report.pum_scheduleprogress != null ? `${report.pum_scheduleprogress} %` : "—"],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: infoRows,
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: C.darkGrey } },
    styles: { fontSize: 8, cellPadding: 2 },
    theme: "plain",
    tableLineColor: C.lightGrey,
    tableLineWidth: 0.2,
  });
  y = afterTable(doc, y);

  // ── Staffing ─────────────────────────────────────────────────
  y = drawSectionTitle(doc, t("staffingWeek", lang, week), margin, y, contentW);
  if (staffing.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C.midGrey1);
    doc.text(t("noResources", lang), margin, y);
    y += 6;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[t("name", lang)]],
      body: staffing.map((r) => [r.name]),
      foot: [[`${t("total", lang)}: ${staffing.length}`]],
      headStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontSize: 7 },
      footStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      theme: "grid",
    });
    y = afterTable(doc, y);
  }

  // ── 3-Week Schedule ──────────────────────────────────────────
  y = drawSectionTitle(doc, t("threeWeekSchedule", lang), margin, y, contentW);
  if (activeCells.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C.midGrey1);
    doc.text(t("noTasks", lang), margin, y);
    y += 6;
  } else {
    const schedHead = [
      // Row 1: week group labels
      [
        { content: "", styles: { fillColor: C.lightGrey } },
        { content: "", styles: { fillColor: C.lightGrey } },
        ...weeks.map((w) => ({
          content: w.label,
          colSpan: 5,
          styles: { halign: "center" as const, fillColor: C.accentBg, textColor: C.accent, fontStyle: "bold" as const },
        })),
      ],
      // Row 2: task / area / day labels
      [
        { content: t("task", lang),  styles: { fillColor: C.lightGrey, fontStyle: "bold" as const } },
        { content: t("area", lang),  styles: { fillColor: C.lightGrey, fontStyle: "bold" as const } },
        ...days.map((_, i) => ({
          content: dayLabels[i % 5],
          styles: { halign: "center" as const, fillColor: C.lightGrey, fontSize: 6 },
        })),
      ],
    ];
    const schedBody = activeCells.map((cell) => [
      cell.taskName,
      cell.area || "—",
      ...cell.days.map((active) => (active ? "x" : "")),
    ]);
    const dayCols = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [
        i + 2,
        { cellWidth: COL_DAY, halign: "center" as const, fontSize: 7 },
      ])
    );
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: schedHead,
      body: schedBody,
      headStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: COL_TASK },
        1: { cellWidth: COL_AREA, textColor: C.midGrey1, fontSize: 7 },
        ...dayCols,
      },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      theme: "grid",
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 2 && data.cell.raw === "x") {
          data.cell.styles.fillColor = C.accent;
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
      },
    });
    y = afterTable(doc, y);
  }

  // ── Status & Comments ─────────────────────────────────────────
  y = drawSectionTitle(doc, t("statusComments", lang), margin, y, contentW);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text(t("commentSummary", lang), margin, y);
  y += 4;
  y = drawCommentBox(doc, report.pum_comment ?? "", margin, y, contentW);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text(t("kpiStatus", lang), margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[t("dimension", lang), t("current", lang), t("proposed", lang), t("note", lang)]],
    body: KPI_DIMS.map(({ key, labelKey, hasComment }) => {
      const curVal  = report[`pum_kpicurrent${key}` as keyof PumStatusReporting] as number | undefined;
      const newVal  = report[`pum_kpinew${key}` as keyof PumStatusReporting] as number | undefined;
      const comment = hasComment
        ? (report[`pum_kpinew${key}comment` as keyof PumStatusReporting] as string | undefined)
        : undefined;
      return [t(labelKey, lang), kpiText(curVal, lang), kpiText(newVal, lang), comment || "—"];
    }),
    headStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontSize: 7 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 38, fontSize: 7 },
      2: { cellWidth: 38, fontSize: 7 },
    },
    styles: { fontSize: 8, cellPadding: 2 },
    theme: "grid",
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 1 || data.column.index === 2) {
        const dim = KPI_DIMS[data.row.index];
        if (!dim) return;
        const fieldKey = data.column.index === 1
          ? `pum_kpicurrent${dim.key}`
          : `pum_kpinew${dim.key}`;
        const val = report[fieldKey as keyof PumStatusReporting] as number | undefined;
        data.cell.styles.textColor = kpiColor(val);
      }
      if (data.row.index === 0) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = afterTable(doc, y);

  // ── Changes ───────────────────────────────────────────────────
  if (isLargeProject) {
    y = drawSectionTitle(doc, t("changes", lang), margin, y, contentW);
    if (changes.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...C.midGrey1);
      doc.text(t("noChanges", lang), margin, y);
      y += 6;
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[t("change", lang), t("status", lang), t("dateApproved", lang), t("note", lang)]],
        body: changes.map((c) => {
          const approved = c.pum_approved === true;
          const dateStr = c.pum_dateapproved
            ? new Date(c.pum_dateapproved).toLocaleDateString()
            : "—";
          return [
            c.pum_name,
            approved ? t("statusApproved", lang) : t("statusNotApproved", lang),
            dateStr,
            c.pum_description ?? "—",
          ];
        }),
        headStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontSize: 7 },
        columnStyles: { 1: { cellWidth: 30 }, 2: { cellWidth: 28 } },
        styles: { fontSize: 8, cellPadding: 2 },
        theme: "grid",
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            const c = changes[data.row.index];
            data.cell.styles.textColor = c.pum_approved ? C.accent : C.midGrey1;
            data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = afterTable(doc, y);
    }
  }

  // ── Risks ─────────────────────────────────────────────────────
  if (isLargeProject) {
    y = drawSectionTitle(doc, t("risks", lang), margin, y, contentW);
    if (risks.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...C.midGrey1);
      doc.text(t("noRisks", lang), margin, y);
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [[t("risk", lang), t("impact", lang), t("probability", lang)]],
        body: risks.map((r) => [
          r.pum_name + (r.pum_riskdescription ? `\n${r.pum_riskdescription}` : ""),
          r.pum_riskimpact != null ? (IMPACT_LABELS[r.pum_riskimpact] ?? String(r.pum_riskimpact)) : "—",
          r.pum_probability != null ? (PROBABILITY_LABELS[r.pum_probability] ?? String(r.pum_probability)) : "—",
        ]),
        headStyles: { fillColor: C.lightGrey, textColor: C.darkGrey, fontSize: 7 },
        columnStyles: {
          1: { halign: "right", cellWidth: 32 },
          2: { halign: "right", cellWidth: 25 },
        },
        styles: { fontSize: 8, cellPadding: 2 },
        theme: "grid",
      });
    }
  }

  return doc.output("blob");
}
