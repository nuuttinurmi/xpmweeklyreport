# Setup: Työvaiheilmoitus Code App

## Prerequisites

- Node.js LTS
- Power Platform CLI (`npm install -g @microsoft/powerplatform-cli` or via winget)
- Power Apps SDK: installed via `npm install` (included in package.json)
- Power Platform environment with:
  - Code apps enabled (Admin center → Environments → Settings → Features → Power Apps code apps)
  - All tables from Projektisuunnitelma.md created (aud_weeklyreport, aud_weeklyreporttasknote)

---

## Step 1 — Clone and install

```bash
# If using degit from template:
npx degit github:microsoft/PowerAppsCodeApps/templates/vite weeklyreport-codeapp
# Or just use this repo directly

cd weeklyreport-codeapp
npm install
```

---

## Step 2 — Authenticate to Power Platform

```bash
pac auth create --environment https://yourorg.crm4.dynamics.com
```

Verify:
```bash
pac auth list
pac org who
```

---

## Step 3 — Initialize as a Code App

```bash
npx power-apps init --displayName "Työvaiheilmoitus" --environmentId <your-env-id>
```

This creates `power.config.json` in the project root.

---

## Step 4 — Add Dataverse tables as data sources

Run these commands one by one. Each generates a typed service + model file in `src/generated/`.

```bash
# xPM tables
pac code add-data-source -a dataverse -t pum_initiative
pac code add-data-source -a dataverse -t pum_gantttask
pac code add-data-source -a dataverse -t pum_assignment
pac code add-data-source -a dataverse -t pum_resource
pac code add-data-source -a dataverse -t pum_role
pac code add-data-source -a dataverse -t pum_changerequest
pac code add-data-source -a dataverse -t pum_risk

# Dynamics tables
pac code add-data-source -a dataverse -t ecr_projectportfolio2
pac code add-data-source -a dataverse -t account
pac code add-data-source -a dataverse -t contact

# New aud_ tables (must exist in Dataverse first — see Projektisuunnitelma.md step 1.1)
pac code add-data-source -a dataverse -t aud_weeklyreport
pac code add-data-source -a dataverse -t aud_weeklyreporttasknote
```

**Note:** All data access goes through the generated services in `src/generated/`.
`pac code add-data-source` must be run for each table so the Power Apps host grants
connector permissions at runtime and the typed service files are available.

---

## Step 5 — Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local — only VITE_PA_FLOW_URL is needed (leave empty to disable PDF export)
```

---

## Step 6 — Run locally

```bash
npx power-apps run
```

Open the **Local Play** URL in the same browser profile logged into your Power Platform tenant.

> **Chrome/Edge note:** Since Dec 2025, local network access requires a browser permission prompt.
> Grant it when asked, or set `--allow-local-network-access` in Edge flags.

---

## Step 7 — Deploy to Power Apps

```bash
npm run push
# Equivalent to: npm run build && npx power-apps push
```

The CLI returns a Power Apps URL. Share with PM users from `make.powerapps.com`.

---

## Power Automate flow for PDF → SharePoint (optional)

If you want "Generoi PDF →" to save a server-side PDF to SharePoint:

1. Create an instant cloud flow with HTTP trigger
2. Flow receives JSON body: `{ reportId, initiativeId, weekNumber, year }`
3. Flow logic:
   - Fetch all data from Dataverse (same queries as the app)
   - Build PDF via Paginated Report (recommended) or HTML→PDF connector
   - Save to SharePoint project library
   - PATCH `aud_weeklyreport.aud_outputfileurl` with the SharePoint file URL
   - PATCH `aud_weeklyreport.aud_status = "Valmis"`
4. Copy the HTTP trigger URL into `.env.local` as `VITE_PA_FLOW_URL`

The app's "Tulosta / Esikatsele" button always works independently via `window.print()`.

---

## Dataverse tables required (from Projektisuunnitelma.md step 1.1)

Before running the app, ensure these tables exist:

### aud_weeklyreport
| Column | Type |
|---|---|
| aud_weeklyreportid | Autonumber (PK) |
| aud_weeknumber | Integer |
| aud_year | Integer |
| aud_status | Choice (Luonnos/Valmis/Lähetetty) |
| aud_actionitems | Multiline text |
| aud_safetynotes | Multiline text |
| aud_situationsummary | Multiline text |
| aud_additionalinfo | Text |
| aud_outputfileurl | URL |
| aud_initiative | Lookup → pum_initiative |

### aud_weeklyreporttasknote
| Column | Type |
|---|---|
| aud_weeklyreporttasknoteid | Autonumber (PK) |
| aud_notes | Multiline text |
| aud_weeklyreport | Lookup → aud_weeklyreport |
| aud_gantttask | Lookup → pum_gantttask |
