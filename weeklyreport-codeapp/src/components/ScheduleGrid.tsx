import type { ScheduleCell } from "../types/dataverse";
import type { buildScheduleColumns } from "../utils/weekUtils";
import type { Lang } from "../i18n/translations";
import { t } from "../i18n/translations";

interface Props {
  cells: ScheduleCell[];
  columns: ReturnType<typeof buildScheduleColumns>;
  lang: Lang;
}

export function ScheduleGrid({ cells, columns, lang }: Props) {
  const { weeks, days } = columns;
  const dayLabels = [t("mon", lang), t("tue", lang), t("wed", lang), t("thu", lang), t("fri", lang)];
  const activeCells = cells.filter((c) => c.days.some(Boolean));

  return (
    <section className="report-section">
      <h2 className="section-title">{t("threeWeekSchedule", lang)}</h2>
      {activeCells.length === 0 ? (
        <p className="text-sm text-audico-mid-grey-1 italic">{t("noTasks", lang)}</p>
      ) : (
        <div className="schedule-wrapper overflow-x-auto">
          <table className="schedule-table border-collapse text-xs min-w-[600px]">
            <thead>
              {/* Week header row */}
              <tr>
                <th className="border border-audico-mid-grey-3 px-3 py-2 bg-audico-light-grey font-semibold text-left w-48" rowSpan={2}>
                  {t("task", lang)}
                </th>
                <th className="border border-audico-mid-grey-3 px-3 py-2 bg-audico-light-grey font-semibold text-left w-28" rowSpan={2}>
                  {t("area", lang)}
                </th>
                {weeks.map((w) => (
                  <th
                    key={`${w.week}-${w.year}`}
                    colSpan={5}
                    className="border border-audico-mid-grey-3 px-2 py-1.5 bg-[var(--audico-accent-subtle)] text-[var(--audico-accent)] font-bold text-center"
                  >
                    {w.label}
                  </th>
                ))}
              </tr>
              {/* Day header row */}
              <tr>
                {days.map((d, i) => (
                  <th key={d.isoDate} className="border border-audico-mid-grey-3 px-1 py-1 bg-audico-light-grey font-semibold text-center w-7">
                    {dayLabels[i % 5]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCells.map((cell) => (
                <tr key={cell.taskId}>
                  <td className="border border-audico-mid-grey-3 px-3 py-1.5 text-audico-black">{cell.taskName}</td>
                  <td className="border border-audico-mid-grey-3 px-3 py-1.5 text-audico-mid-grey-1">{cell.area || "—"}</td>
                  {cell.days.map((active, i) => (
                    <td
                      key={i}
                      className={active
                        ? "schedule-cell-active border border-audico-mid-grey-3 w-7 text-center"
                        : "border border-audico-mid-grey-3 w-7 text-center"
                      }
                    >
                      {active ? "×" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
