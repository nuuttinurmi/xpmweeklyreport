import React from "react";
import type { ScheduleCell } from "../types/dataverse";
import type { buildScheduleColumns } from "../utils/weekUtils";

interface Props {
  cells: ScheduleCell[];
  columns: ReturnType<typeof buildScheduleColumns>;
}

const DAY_LABELS = ["Ma", "Ti", "Ke", "To", "Pe"];

export function ScheduleGrid({ cells, columns }: Props) {
  const { weeks, days } = columns;
  // Filter out rows where no day is active (task outside entire 3-week window)
  const activeCells = cells.filter((c) => c.days.some(Boolean));

  return (
    <section className="report-section">
      <h2 className="report-section__title">Seuraavan 3 viikon aikataulu</h2>
      {activeCells.length === 0 ? (
        <p className="empty-state">Ei tehtäviä valitulla aikajänteellä.</p>
      ) : (
        <div className="schedule-wrapper">
          <table className="schedule-table">
            <thead>
              {/* Week header row */}
              <tr>
                <th className="schedule-table__task-col" rowSpan={2}>
                  Tehtävä
                </th>
                <th className="schedule-table__area-col" rowSpan={2}>
                  Alue
                </th>
                {weeks.map((w) => (
                  <th
                    key={`${w.week}-${w.year}`}
                    colSpan={5}
                    className="schedule-table__week-header"
                  >
                    {w.label}
                  </th>
                ))}
              </tr>
              {/* Day header row */}
              <tr>
                {days.map((d) => (
                  <th key={d.isoDate} className="schedule-table__day-header">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCells.map((cell) => (
                <tr key={cell.taskId}>
                  <td className="schedule-table__task-name">{cell.taskName}</td>
                  <td className="schedule-table__area">
                    {cell.area || "—"}
                  </td>
                  {cell.days.map((active, i) => (
                    <td
                      key={i}
                      className={
                        active
                          ? "schedule-table__cell schedule-table__cell--active"
                          : "schedule-table__cell"
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
      <p className="data-source-note">
        Datalähde: xPM <code>pum_gantttask</code> (pum_startdate / pum_enddate). Automaattinen.
      </p>
    </section>
  );
}
