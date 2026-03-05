
# Työvaiheilmoituksen automatisointi xPM/Dynamics-datalla

## Tausta ja tavoite
Tämän dokumentin tarkoituksena on kuvata, miten nykyinen **OP_Työvaiheilmoituspohja.xlsx** automatisoidaan mahdollisimman pitkälle **Dynamics 365 / xPM** -datalla siten, että:
- manuaalinen työ minimoituu
- tieto on rakenteista ja uudelleenkäytettävää
- raportit ovat Copilotin ja muiden AI-ratkaisujen löydettävissä

Lopputuloksena työvaiheilmoitus **generoidaan**, sitä ei kirjoiteta käsin.

---

## 1. Kenttä–kenttä-mapping (Excel → xPM/Dynamics)

### Yhdistävä avain: Projektinumero

xPM:n `pum_initiative` ja Dynamicsin `ecr_projectportfolio2` yhdistetään **projektinumeron** kautta (tekstikenttä, ei suora lookup).
Tämä on koko raportin perusavain, jolla haetaan data molemmista järjestelmistä.

### Projektimalli: Large vs Small

xPM:ssä on kaksi projektityyppiä, jotka vaikuttavat raportin sisältöön:

| Projektityyppi | Käytettävissä olevat moduulit |
|---|---|
| **Large Initiative** | Kaikki: Details, Timeline, Board, Financials, Risks, Stakeholders, KPI Status, Changes, Dependencies, Documents, Dashboard |
| **Small Initiative** | Vain ydin: Details, Timeline, Board, KPI Status, Documents |

**Vaikutus raporttiin:** Small-projektissa ei ole Risks- eikä Changes-moduulia, joten nämä osiot jätetään pois raportista. Projektityyppi tarkistetaan `pum_initiative.pum_projecttype`-kentästä (493840000 = Small, 493840002 = Large).

| Raportin osio | Large | Small |
|---|---|---|
| Otsikkotiedot | ✅ | ✅ |
| Vahvuus (roolit) | ✅ | ✅ |
| Tehtävät + valmiusaste | ✅ | ✅ |
| 3 vk aikataulu | ✅ | ✅ |
| Muutokset | ✅ | ❌ |
| Riskit (sis. työturvallisuus) | ✅ | ❌ |
| KPI Status (6 dimensiota) | ✅ | ✅ |
| Tilannekuva + kommentti | ✅ | ✅ |

---

### 1.1 Otsikkotiedot (100 % automaattiset)

| Excel-kenttä | Lähde | Taulu | Kenttä | Huomio |
|---|---|---|---|---|
| Päivämäärä / järj. nro | Generoitu | — | — | Juokseva nro + vuosi (esim. 004/2025) |
| Projektinumero | Dynamics | `ecr_projectportfolio2` | `ecr_projectnumber` | Yhdistävä avain |
| Projekti | Dynamics | `ecr_projectportfolio2` | `ecr_name` | |
| Projektipäällikkö | Dynamics | `ecr_projectportfolio2` | `ecr_projectmanager` | |
| Asiakas | Dynamics | `ecr_projectportfolio2` → `account` | `ecr_customerid` → `name` | Lookup |
| Asiakkaan yhteyshenkilö | Dynamics | `ecr_projectportfolio2` → `contact` | `ecr_contactid` → `fullname` | Lookup |
| Viikko | Generoitu | — | — | ISO-viikko |
| Urakka | Dynamics | `ecr_projectportfolio2` | `aud_agreement` (Billing Method) | Arvot: Fixed Price / Time and Material |
| Vaihe | xPM | `pum_statusreporting` | `pum_currentphase` | Projektin nykyinen vaihe |
| Aikataulun edistyminen | xPM | `pum_statusreporting` | `pum_scheduleprogress` | 0–100 % |

---

### 1.2 Vahvuus (rooleittain)

Lasketaan **xPM:stä** raporttiviikolle. Lähteenä resurssien tehtäväkohdennukset. Esitetään suoraan xPM:n rooleilla — ei mapata kolmeen kategoriaan.

**Datapolku:**
```
pum_initiative (projekti)
  → pum_gantttask (tehtävät, joiden pum_startdate/pum_enddate osuu raporttiviikolle)
    → pum_assignment (resurssien kohdennukset tehtäville)
      → pum_resource (resurssi: Named / Generic)
        → pum_role (rooli: AV Installer, AV Project Manager, jne.)
```

**Logiikka:**
1. Hae projektin tehtävät (`pum_gantttask`), joiden aikajänne osuu raporttiviikolle
2. Hae tehtävien resurssit (`pum_assignment` → `pum_resource`)
3. Ryhmittele resurssit roolin (`pum_role`) mukaan
4. Laske uniikkien henkilöiden määrä per rooli

**Tulostusmuoto:** Roolikohtainen erittely, esim.:
```
AV Installer: 2, AV Consultant: 1, AV Project Manager: 1
```

**Huomio:** Geneerisiä resursseja (placeholder) ei lasketa vahvuuteen — vain Named-resurssit.

---

### 1.3 Projektitilanne ja työmaatila

Perustuvat **xPM:n** tehtäviin.

**Datapolku:**
```
pum_initiative (projekti)
  → pum_gantttask (tehtävät)
      Kentät: pum_name, pum_wbs, pum_tasktype, Category (custom),
              Work (suunnitellut tunnit), Actual work, Remaining work
```

| Raportin kenttä | xPM-kenttä | Huomio |
|---|---|---|
| Tehtävä | `pum_gantttask.pum_name` | |
| Alue | Johdetaan `pum_gantttask.pum_name` tai WBS-hierarkiasta | Alue sisältyy tehtävän nimeen (esim. "Kerros 3 > Asennus") |
| Valmiusaste (%) | Laskettu: `Actual work / Work × 100` | Tai oma %-kenttä jos olemassa |

**Rivityypin erottelu:**
Ei erotella ProjectSituation / SiteSituation -osioihin. Kaikki tehtävät esitetään yhdessä listassa.

---

### 1.4 Seuraavan kolmen viikon aikataulu

Generoidaan **xPM:n** Gantt-datasta.

**Datapolku:**
```
pum_gantttask
  Kentät: pum_startdate, pum_enddate, pum_duration, pum_name, Category
```

**Logiikka:**
1. Hae projektin tehtävät, joiden `pum_startdate` ≤ viikko N+1 perjantai JA `pum_enddate` ≥ viikko N-1 maanantai
2. Jokaiselle tehtävälle laske päiväkohtainen osuma (Ma–Pe) kolmelle viikolle
3. Renderöi tuttuun Ma–Pe -ruudukkoon

---

### 1.5 KPI Status, riskit, muutokset ja tilannekuva

Kaikki nämä osiot tulevat xPM:stä — uusia tauluja ei tarvita.

| Osa-alue | Lähde | Taulu / kenttä | Tila |
|---|---|---|---|
| KPI Status (6 dimensiota) | xPM | `pum_statusreporting` — Resources, Summary, Quality, Cost, Scope, Schedule. Current (xPM-hallittu) + Proposed (PM-muokattava) per dimensio. Arvot: Not Set / Need Help / At Risk / No Issue | OK — Large & Small |
| KPI-kommentit | xPM | `pum_statusreporting` — `pum_kpinew*comment` (5 kenttää: Resources, Quality, Cost, Scope, Schedule) | OK |
| Tilannekuva (vapaa teksti) | xPM | `pum_statusreporting.pum_comment` — PM:n vapaa tilannekuvaus. Kattaa myös action items ja muut huomiot. | OK — Large & Small |
| Muutokset | xPM | `pum_changerequest` — projektin muutospyynnöt, tila ja kuvaus | OK — **vain Large** |
| Riskit (sis. työturvallisuus) | xPM | `pum_risk` — Impact (1–5), Probability (0–100 %), nimi, kuvaus. Työturvallisuusriskit kirjataan riskinä xPM:ään. | OK — **vain Large** |

---

## 2. Lähdejärjestelmien tietomalli

### 2.1 xPM (Projectum) — Dataverse-taulut

Resursointi, aikataulut ja tehtävät tulevat xPM:stä.

| Taulu | Tarkoitus | Avainkenttää raporttia varten |
|---|---|---|
| `pum_initiative` | Projekti | Nimi, Expected Start/Finish, Portfolio, Program, `pum_projecttype` (Large/Small) |
| `pum_statusreporting` | Raporttientiteetti + KPI Status | `pum_statusdate`, `pum_comment`, `pum_currentphase`, `pum_scheduleprogress`, KPI current/new × 6, KPI-kommentit × 5 |
| `pum_gantttask` | Tehtävä/työvaihe | `pum_name`, `pum_startdate`, `pum_enddate`, `pum_duration`, `pum_wbs`, `pum_tasktype`, Work, Actual work, Remaining work, Category |
| `pum_assignment` | Resurssin kohdistus tehtävälle | Linkki tehtävään + resurssiin |
| `pum_resource` | Resurssi (Named/Generic) | Display Name, Email, Role (lookup), Resource Type, Daily Capacity |
| `pum_role` | Resurssin rooli | 18 roolia, mm. AV Installer, AV Project Manager, AV Consultant |
| `pum_changerequest` | Muutospyynnöt | Nimi, kuvaus, status (vain Large) |
| `pum_risk` | Riskit (sis. työturvallisuus) | Nimi, kuvaus, Impact, Probability (vain Large) |
| `pum_tasklink` | Tehtäväriippuvuudet | Predecessor/Successor |
| `pum_calendar` | Kalenterit | Default Daily Capacity, kansalliset pyhät |

**xPM-hierarkia:**
```
pum_portfolio → pum_program → pum_initiative → pum_gantttask → pum_assignment → pum_resource (+ pum_role)
                                             → pum_statusreporting (raportti + KPI)
                                             → pum_changerequest (vain Large)
                                             → pum_risk (vain Large)
```

---

### 2.2 Dynamics 365 — Dataverse-taulut

Asiakastiedot ja projektinhallinta tulevat Dynamicsista.

| Taulu | Tarkoitus | Avainkenttää raporttia varten |
|---|---|---|
| `ecr_projectportfolio2` | Projektiportfolio (keskeisin) | `ecr_projectnumber`, `ecr_name`, `ecr_projectmanager`, `ecr_customerid`, `ecr_contactid`, `aud_agreement`, `ecr_startdate`, `ecr_enddate` |
| `account` | Asiakas | `name`, `accountnumber` |
| `contact` | Yhteyshenkilö | `fullname`, `emailaddress1` |

---

### 2.3 Raporttientiteetti: pum_statusreporting (xPM:n oma taulu)

Erillisiä uusia tauluja **ei tarvita**. Raporttientiteettinä käytetään xPM:n omaa `pum_statusreporting`-taulua, joka on jo linkitetty `pum_initiative`:en ja sisältää KPI Status -kentät.

**Keskeiset kentät raporttia varten:**

| Kenttä | Tyyppi | Huomio |
|---|---|---|
| `pum_statusdate` | DateTime | Raportin päivämäärä |
| `pum_comment` | Multiline text | PM:n vapaa tilannekuva (sis. action items, huomiot) |
| `pum_currentphase` | Text | Projektin nykyinen vaihe |
| `pum_scheduleprogress` | Number | Aikataulun edistyminen (0–100 %) |
| `pum_budget` | Currency | Budjetti |
| `pum_actualcost` | Currency | Toteutuneet kustannukset |
| `pum_statuscategory` | Choice | Bi-Weekly Status / Gate Decision |
| `pum_kpicurrent*` | Choice × 6 | KPI nykytila (xPM-hallittu, read-only) |
| `pum_kpinew*` | Choice × 6 | KPI ehdotus (PM-muokattava) |
| `pum_kpinew*comment` | Text × 5 | KPI-kommentit per dimensio |
| `statecode` | Choice | Active (0) / Inactive (1) |

**KPI-dimensiot (6 kpl):** Resources, Summary, Quality, Cost, Scope, Schedule
**KPI-arvot:** Not Set (493840000), Need Help (493840001), At Risk (493840002), No Issue (493840003)

**Miksi erillisiä tauluja ei tarvita:**
- Otsikkotiedot → haetaan lennossa `ecr_projectportfolio2` → `account` / `contact`
- Vahvuus → haetaan lennossa `pum_gantttask` → `pum_assignment` → `pum_resource` → `pum_role`
- Tehtävät + valmiusaste → haetaan lennossa `pum_gantttask` (Work / Actual work)
- 3 vk aikataulu → haetaan lennossa `pum_gantttask` (pum_startdate / pum_enddate)
- Muutokset → haetaan lennossa `pum_changerequest` (vain Large)
- Riskit (sis. työturvallisuus) → haetaan lennossa `pum_risk` (vain Large)
- KPI Status + tilannekuva → suoraan `pum_statusreporting` (current/proposed + comment)

---

### 2.4 UI: Code App (React/TypeScript)

Toteutus on React/TypeScript code app, joka ajetaan Power Apps Code App -ympäristössä.

**Näkymät:**

1. **Raporttilista** (ReportList): Initiative-valitsin + lista `pum_statusreporting`-tietueista
2. **Raporttieditori** (ReportEditor): Kaikki raportin osiot yhdessä näkymässä
   - Otsikkotiedot (automaattinen)
   - Vahvuustaulukko (automaattinen)
   - Tehtävät + valmiusaste (automaattinen)
   - 3 vk aikatauluruudukko (automaattinen)
   - KPI Status -taulukko (current read-only, proposed PM-muokattava)
   - Tilannekuva / kommentti (PM-muokattava)
   - Muutokset (automaattinen, vain Large)
   - Riskit (automaattinen, vain Large)
3. **Tulostus/PDF:** Selaimen print-toiminto + optionaalinen Power Automate -flow

**Tekniikka:** React 18, TypeScript, Vite, MSAL-autentikointi, Dataverse OData API

---

## 3. Automaatio- ja prosessiketju

```
Viikoittainen sykli:

1. PM avaa code appin ja valitsee initiativen
   │
   └─ Näkee listan aiemmista pum_statusreporting-tietueista

2. PM luo uuden statuspäivityksen ("+ New Status Report")
   │
   └─ Luo pum_statusreporting-tietue (päivämäärä, initiative-linkki)

3. PM täyttää raportissa:
   │
   ├─ KPI Status: ehdotukset 6 dimensiolle (proposed) + kommentit
   ├─ Tilannekuva (pum_comment): vapaa teksti — sis. action items, huomiot
   └─ Tallentaa

4. Automaattinen data haetaan lennossa:
   │
   ├─ Otsikkotiedot: ecr_projectportfolio2 → account, contact
   ├─ Vahvuus: pum_gantttask → pum_assignment → pum_resource → pum_role
   ├─ Tehtävät + valmiusaste: pum_gantttask (Work / Actual work)
   ├─ 3 vk aikataulu: pum_gantttask (start/end)
   ├─ Muutokset: pum_changerequest (vain Large)
   └─ Riskit: pum_risk (vain Large)

5. PM tulostaa / generoi PDF:n
   │
   ├─ Selaimen print (suora PDF-tuloste)
   └─ TAI Power Automate -flow → PDF → SharePoint
```

PDF/portaalinäkymä toimii vain **esitysmuotona**, Dataverse on tiedon lähde.

---

## 4. Periaatteet ja hyödyt

- Yksi totuuden lähde (xPM/Dynamics)
- Ei uusia tauluja — käytetään xPM:n olemassa olevaa `pum_statusreporting`-taulua
- Vähemmän käsityötä
- Tasalaatuinen raportointi
- Parempi löydettävyys Copilotille
- Valmius MCP- ja AI-agenttiratkaisuihin jatkossa

---

## 5. Yhden lauseen toimintamalli

> Työvaiheilmoitus generoidaan viikoittain xPM/Dynamics-datasta, ja PDF on vain asiakkaalle näkyvä ulostulo.

---

## 6. Datan saatavuus — yhteenveto

### Vihreä — data löytyy suoraan

| Raportin osio | Lähde | Datapolku |
|---|---|---|
| Projektinumero, nimi, PM | Dynamics | `ecr_projectportfolio2` |
| Asiakas, yhteyshenkilö | Dynamics | `ecr_projectportfolio2` → `account` / `contact` |
| Vahvuus (roolittain) | xPM | `pum_gantttask` → `pum_assignment` → `pum_resource` → `pum_role` |
| Tehtävät ja valmiusaste | xPM | `pum_gantttask` (Work / Actual work) |
| 3 viikon aikataulu | xPM | `pum_gantttask` (pum_startdate / pum_enddate) |
| Muutokset | xPM | `pum_changerequest` — **vain Large** |
| Riskit (sis. työturvallisuus) | xPM | `pum_risk` — **vain Large** |
| KPI Status (6 dimensiota) | xPM | `pum_statusreporting` (current/proposed) |
| Tilannekuva + kommentti | xPM | `pum_statusreporting.pum_comment` |

### Ratkaisut aiempiin avoimiin kysymyksiin

| Asia | Ratkaisu |
|---|---|
| Sopimustyyppi (Urakka) | `aud_agreement` = Billing Method, arvot: Fixed Price / Time and Material |
| Roolien kategorisointi | Käytetään suoraan xPM:n rooleja (`pum_role`), ei mapata |
| Alue-kenttä tehtävissä | Johdetaan tehtävänimestä / WBS-hierarkiasta |
| ProjectSituation vs SiteSituation | Ei erotella, kaikki tehtävät yhdessä listassa |
| Action items (muilta vaaditut) | Sisältyy `pum_comment`-kenttään (vapaa tilannekuva) |
| Työturvallisuus | Kirjataan riskinä xPM:ään (`pum_risk`) |
| Tilannekuva | xPM KPI Status (Overall + Comments) |
| xPM ↔ Dynamics -linkki | Projektinumeron perusteella (ei suoraa lookuppia) |
| Erillinen taulu PM-syötteille | Ei tarvita — `pum_statusreporting` kattaa kaiken |
