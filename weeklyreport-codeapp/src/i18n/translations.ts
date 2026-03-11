export type Lang = "en" | "fi" | "sv";

const translations = {
  // Report title
  reportTitle: { en: "WORK PHASE REPORT", fi: "TYÖVAIHERAPORTTI", sv: "ARBETSFASRAPPORT" },

  // ReportEditor toolbar
  back: { en: "Back", fi: "Takaisin", sv: "Tillbaka" },
  save: { en: "Save", fi: "Tallenna", sv: "Spara" },
  saving: { en: "Saving...", fi: "Tallennetaan...", sv: "Sparar..." },
  downloadPdf: { en: "Download PDF", fi: "Lataa PDF", sv: "Ladda ned PDF" },
  saveFirst: { en: "Save first", fi: "Tallenna ensin", sv: "Spara forst" },
  generatePdf: { en: "Generate PDF", fi: "Luo PDF", sv: "Skapa PDF" },
  generating: { en: "Generating...", fi: "Luodaan...", sv: "Skapar..." },
  pdfSuccess: { en: "PDF generated and saved to SharePoint.", fi: "PDF luotu ja tallennettu SharePointiin.", sv: "PDF skapad och sparad i SharePoint." },
  loadingReport: { en: "Loading report...", fi: "Ladataan raporttia...", sv: "Laddar rapport..." },
  statusReport: { en: "Status Report", fi: "Tilanneraportti", sv: "Statusrapport" },
  wk: { en: "Wk", fi: "Vko", sv: "V" },

  // ReportHeader
  projectInformation: { en: "Project Information", fi: "Projektin perustiedot", sv: "Projektinformation" },
  date: { en: "Date", fi: "Paivamaara", sv: "Datum" },
  projectNumber: { en: "Project Number", fi: "Projektinumero", sv: "Projektnummer" },
  project: { en: "Project", fi: "Projekti", sv: "Projekt" },
  client: { en: "Client", fi: "Asiakas", sv: "Kund" },
  projectManager: { en: "Project Manager", fi: "Projektipäällikkö", sv: "Projektledare" },
  phase: { en: "Phase", fi: "Vaihe", sv: "Fas" },
  scheduleProgress: { en: "Schedule Progress", fi: "Aikataulun edistyminen", sv: "Tidplanens framsteg" },

  // StaffingTable
  staffingWeek: { en: "Staffing (week {0})", fi: "Vahvuus (viikko {0})", sv: "Bemanning (vecka {0})" },
  name: { en: "Name", fi: "Nimi", sv: "Namn" },
  total: { en: "Total", fi: "Yhteensa", sv: "Totalt" },
  noResources: { en: "No resources for this week.", fi: "Ei resursseja talle viikolle.", sv: "Inga resurser denna vecka." },

  // ScheduleGrid
  threeWeekSchedule: { en: "3-Week Schedule", fi: "3 viikon aikataulu", sv: "3-veckorsschema" },
  task: { en: "Task", fi: "Tehtava", sv: "Uppgift" },
  area: { en: "Area", fi: "Alue", sv: "Omrade" },
  noTasks: { en: "No tasks in the selected time range.", fi: "Ei tehtavia valitulla aikavaliilla.", sv: "Inga uppgifter i valt tidsintervall." },
  mon: { en: "Mon", fi: "Ma", sv: "Man" },
  tue: { en: "Tue", fi: "Ti", sv: "Tis" },
  wed: { en: "Wed", fi: "Ke", sv: "Ons" },
  thu: { en: "Thu", fi: "To", sv: "Tor" },
  fri: { en: "Fri", fi: "Pe", sv: "Fre" },

  // PMFields
  statusComments: { en: "Status & Comments", fi: "Tilanne ja kommentit", sv: "Status och kommentarer" },
  commentSummary: { en: "Comment / Situation summary", fi: "Kommentti / Tilanteen yhteenveto", sv: "Kommentar / Sammanfattning av situationen" },
  commentPlaceholder: { en: "Brief description of project status, critical issues, next steps...", fi: "Lyhyt kuvaus projektin tilanteesta, kriittisista asioista, seuraavista askeleista...", sv: "Kort beskrivning av projektstatus, kritiska fragor, nasta steg..." },
  kpiStatus: { en: "KPI Status", fi: "KPI-tilanne", sv: "KPI-status" },
  dimension: { en: "Dimension", fi: "Ulottuvuus", sv: "Dimension" },
  current: { en: "Previous", fi: "Edellinen", sv: "Foregaende" },
  proposed: { en: "Proposed", fi: "Ehdotettu", sv: "Foreslagen" },
  note: { en: "Note", fi: "Huomio", sv: "Anmarkning" },
  kpiSummary: { en: "Summary", fi: "Yhteenveto", sv: "Sammanfattning" },
  kpiResources: { en: "Resources", fi: "Resurssit", sv: "Resurser" },
  kpiQuality: { en: "Quality", fi: "Laatu", sv: "Kvalitet" },
  kpiCost: { en: "Cost", fi: "Kustannus", sv: "Kostnad" },
  kpiScope: { en: "Scope", fi: "Laajuus", sv: "Omfattning" },
  kpiSchedule: { en: "Schedule", fi: "Aikataulu", sv: "Tidplan" },
  kpiNotSet: { en: "Not Set", fi: "Ei asetettu", sv: "Ej satt" },
  kpiNeedHelp: { en: "Need help", fi: "Tarvitsee apua", sv: "Behover hjalp" },
  kpiAtRisk: { en: "At risk", fi: "Riskissa", sv: "I riskzonen" },
  kpiNoIssue: { en: "No issue", fi: "Ei ongelmaa", sv: "Inga problem" },

  // ChangesRisks
  changes: { en: "Changes", fi: "Muutokset", sv: "Andringar" },
  risks: { en: "Risks", fi: "Riskit", sv: "Risker" },
  change: { en: "Change", fi: "Muutos", sv: "Andring" },
  status: { en: "Status", fi: "Tila", sv: "Status" },
  noChanges: { en: "No recorded changes.", fi: "Ei kirjattuja muutoksia.", sv: "Inga registrerade andringar." },
  risk: { en: "Risk", fi: "Riski", sv: "Risk" },
  impact: { en: "Impact", fi: "Vaikutus", sv: "Paverkan" },
  probability: { en: "Probability", fi: "Todennakoisyys", sv: "Sannolikhet" },
  noRisks: { en: "No active risks.", fi: "Ei aktiivisia riskeja.", sv: "Inga aktiva risker." },
  statusOpen: { en: "Open", fi: "Avoin", sv: "Oppen" },
  dateApproved: { en: "Date Approved", fi: "Hyvaksymispvm", sv: "Godkannandedatum" },
  statusApproved: { en: "Approved", fi: "Hyvaksytty", sv: "Godkand" },
  statusNotApproved: { en: "Not Approved", fi: "Ei hyvaksytty", sv: "Ej godkand" },
  statusRejected: { en: "Rejected", fi: "Hylatty", sv: "Avvisad" },
  statusPending: { en: "Pending Approval", fi: "Odottaa hyvaksyntaa", sv: "Vantar pa godkannande" },

  // Language selector
  language: { en: "Language", fi: "Kieli", sv: "Sprak" },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang, ...args: (string | number)[]): string {
  const entry = translations[key];
  let text: string = entry[lang] ?? entry.en;
  for (let i = 0; i < args.length; i++) {
    text = text.replace(`{${i}}`, String(args[i]));
  }
  return text;
}
