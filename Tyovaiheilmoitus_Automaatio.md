
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

**Vaikutus raporttiin:** Small-projektissa ei ole Risks- eikä Changes-moduulia, joten nämä osiot jätetään pois raportista. Projektityyppi tarkistetaan `pum_initiative`-taulusta raportin generoinnissa.

| Raportin osio | Large | Small |
|---|---|---|
| Otsikkotiedot | ✅ | ✅ |
| Vahvuus (roolit) | ✅ | ✅ |
| Tehtävät + valmiusaste | ✅ | ✅ |
| 3 vk aikataulu | ✅ | ✅ |
| Action items (käsin) | ✅ | ✅ |
| Muutokset | ✅ | ❌ |
| Riskit | ✅ | ❌ |
| Työturvallisuus | ✅ | ✅ |
| Tilannekuva | ✅ | ✅ |

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
| Lisätietoja | Käsin | — | — | Harvoin tarvittu |

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
1. Hae projektin tehtävät, joiden `pum_startdate` ≤ viikko N+2 perjantai JA `pum_enddate` ≥ viikko N maanantai
2. Jokaiselle tehtävälle laske päiväkohtainen osuma (Ma–Pe) kolmelle viikolle
3. Renderöi tuttuun Ma–Pe -ruudukkoon

---

### 1.5 MUUTA-osio

Jaetaan kahteen osaan:

**Rakenteinen (Dynamics / xPM):**

| Osa-alue | Lähde | Taulu / kenttä | Tila |
|---|---|---|---|
| Muilta osapuolilta vaaditut toimenpiteet | Käsin | PM kirjoittaa vapaa tekstinä raporttiin | OK |
| Muutokset | xPM | `pum_changerequest` — projektin muutospyynnöt, tila ja kuvaus | OK — **vain Large** |
| Työturvallisuus | Vakioteksti + käsin | Oletusteksti (esim. "Ei poikkeamia"), PM lisää poikkeukset tarvittaessa | OK |
| Riskit | xPM | `pum_risk` — Impact (1–5), Probability (0–100 %), nimi, kuvaus. Filtteri: projektin aktiiviset riskit | OK — **vain Large** |
| Tilannekuva + liikennevalo | xPM | KPI Status: Overall (Not Set / Need Help / At Risk / All Good) + Comments (vapaa teksti) | OK — Large & Small |

---

## 2. Lähdejärjestelmien tietomalli

### 2.1 xPM (Projectum) — Dataverse-taulut

Resursointi, aikataulut ja tehtävät tulevat xPM:stä.

| Taulu | Tarkoitus | Avainkenttää raporttia varten |
|---|---|---|
| `pum_initiative` | Projekti | Nimi, Expected Start/Finish, Portfolio, Program |
| `pum_gantttask` | Tehtävä/työvaihe | `pum_name`, `pum_startdate`, `pum_enddate`, `pum_duration`, `pum_wbs`, `pum_tasktype`, Work, Actual work, Remaining work, Category |
| `pum_assignment` | Resurssin kohdistus tehtävälle | Linkki tehtävään + resurssiin |
| `pum_resource` | Resurssi (Named/Generic) | Display Name, Email, Role (lookup), Resource Type, Daily Capacity |
| `pum_role` | Resurssin rooli | 18 roolia, mm. AV Installer, AV Project Manager, AV Consultant |
| `pum_tasklink` | Tehtäväriippuvuudet | Predecessor/Successor |
| `pum_calendar` | Kalenterit | Default Daily Capacity, kansalliset pyhät |
| KPI Status (pum_initiative tai erillinen entiteetti) | Projektin tilannepäivitys | Overall (Not Set / Need Help / At Risk / All Good), Comments (vapaa teksti). Historia säilyy. |

**xPM-hierarkia:**
```
pum_portfolio → pum_program → pum_initiative → pum_gantttask → pum_assignment → pum_resource (+ pum_role)
```

---

### 2.2 Dynamics 365 — Dataverse-taulut

Asiakastiedot, projektinhallinta ja talous tulevat Dynamicsista.

| Taulu | Tarkoitus | Avainkenttää raporttia varten |
|---|---|---|
| `ecr_projectportfolio2` | Projektiportfolio (keskeisin) | `ecr_projectnumber`, `ecr_name`, `ecr_projectmanager`, `ecr_customerid`, `ecr_contactid`, `aud_agreement`, `ecr_startdate`, `ecr_enddate` |
| `account` | Asiakas | `name`, `accountnumber` |
| `contact` | Yhteyshenkilö | `fullname`, `emailaddress1` |
| `incident` | Case / tukipyyntö | `title`, `casetypecode`, `prioritycode`, project-linkki |
| `ecr_brightorderlineproduct` | Tilausrivituotteet | `ecr_deliverydate`, `ecr_requesteddeliverydate` |
| `salesorder` | Myyntitilaus | POC-kentät, tilausstatus |

---

### 2.3 Uudet taulut (kevyt ratkaisu — vain PM:n syötteet)

Automaattinen data (otsikkotiedot, vahvuus, tehtävät, aikataulu, riskit, muutokset) **ei kopioida** — se haetaan lennossa olemassa olevista tauluista raportin generointihetkellä.

Uusiin tauluihin tallennetaan **vain PM:n viikkokohtaiset käsin kirjoittamat tiedot**.

**`aud_weeklyreport` (pääentiteetti)**

| Kenttä | Tyyppi | Huomio |
|---|---|---|
| Report ID | Autonumber | |
| Initiative | Lookup → `pum_initiative` | Yhdistää raportin projektiin |
| WeekNumber | Integer | ISO-viikko |
| Year | Integer | |
| Status | Choice | Luonnos / Valmis / Lähetetty |
| ActionItems | Multiline text | PM: muilta osapuolilta vaaditut toimenpiteet |
| SafetyNotes | Multiline text | PM: vakioteksti + poikkeukset |
| AdditionalInfo | Text | PM: harvoin tarvittu |
| OutputFileUrl | URL | SharePoint PDF-linkki (täyttyy generoinnissa) |

**Miksi tämä riittää:**
- Otsikkotiedot → haetaan lennossa `ecr_projectportfolio2` → `account` / `contact`
- Vahvuus → haetaan lennossa `pum_gantttask` → `pum_assignment` → `pum_resource` → `pum_role`
- Tehtävät + valmiusaste → haetaan lennossa `pum_gantttask` (Work / Actual work)
- 3 vk aikataulu → haetaan lennossa `pum_gantttask` (pum_startdate / pum_enddate)
- Muutokset → haetaan lennossa `pum_changerequest` (vain Large)
- Riskit → haetaan lennossa `pum_risk` (vain Large)
- Tilannekuva + liikennevalo → haetaan lennossa xPM KPI Status (Overall + Comments)
- PM:n kommentit → `aud_weeklyreport` (ActionItems, SafetyNotes)

---

### 2.4 UI: Initiative-lomakkeen Weekly Reports -välilehti

xPM:n `pum_initiative` -lomakkeelle lisätään uusi välilehti **Weekly Reports**, jossa näkyy subgrid `aud_weeklyreport`-tietueista (sama pattern kuin Changes-välilehti).

**Subgrid-sarakkeet:**
- Vko | Vuosi | Status | Luotu | PDF-linkki

PM klikkaa rivin auki → `aud_weeklyreport`-lomake avautuu:
- **PM:n syöttökentät:** Action items, Työturvallisuus
- **Generoi PDF -painike:** Laukaisee Power Automate -flown joka hakee kaiken automaattisen datan lennossa

**Huom:** Tilannekuva haetaan automaattisesti xPM:n KPI Statusista — PM päivittää sen normaalisti KPI Status -välilehdellä, ei viikkoraporttilomakkeella.

---

## 3. Automaatio- ja prosessiketju

```
Viikoittainen sykli:

1. PM päivittää KPI Statusin xPM:ssä (Overall + Comments)
   │
   └─ Tämä on normaali xPM-työnkulku, ei lisätyötä

2. PM painaa "New Report" (tai Power Automate ajastettuna)
   │
   └─ Luo aud_weeklyreport-tietue (viikko, vuosi, initiative-linkki)

3. PM avaa raportin Weekly Reports -välilehdeltä
   │
   ├─ Täyttää: Action items, Työturvallisuus
   └─ Tallentaa

4. PM painaa "Generoi PDF"
   │
   ├─ Power Automate hakee LENNOSSA:
   │   ├─ Otsikkotiedot: ecr_projectportfolio2 → account, contact
   │   ├─ Vahvuus: pum_gantttask → pum_assignment → pum_resource → pum_role
   │   ├─ Tehtävät + valmiusaste: pum_gantttask
   │   ├─ 3 vk aikataulu: pum_gantttask (start/end)
   │   ├─ Muutokset: pum_changerequest (vain Large)
   │   ├─ Riskit: pum_risk (vain Large)
   │   ├─ Tilannekuva + liikennevalo: xPM KPI Status (Overall + Comments)
   │   └─ PM:n kommentit: aud_weeklyreport (ActionItems, SafetyNotes)
   │
   ├─ Yhdistää datan → generoi PDF
   ├─ Tallentaa PDF:n projektin SharePoint-kirjastoon
   ├─ Päivittää OutputFileUrl-kentän
   └─ Asettaa Status = Valmis
```

PDF/portaalinäkymä toimii vain **esitysmuotona**, Dataverse on tiedon lähde.

---

## 4. Periaatteet ja hyödyt

- Yksi totuuden lähde (xPM/Dynamics)
- Vähemmän käsityötä
- Tasalaatuinen raportointi
- Parempi löydettävyys Copilotille
- Valmius MCP- ja AI-agenttiratkaisuihin jatkossa

---

## 5. Yhden lauseen toimintamalli

> Työvaiheilmoitus generoidaan viikoittain xPM/Dynamics-datasta, ja Excel/PDF on vain asiakkaalle näkyvä ulostulo.

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
| Muutokset | xPM | `pum_changerequest` (projektin muutospyynnöt) — **vain Large** |
| Riskit | xPM | `pum_risk` (Impact, Probability, nimi, kuvaus) — **vain Large** |
| Tilannekuva + liikennevalo | xPM | KPI Status (Overall + Comments) |

### Keltainen — vaatii selvitystä tai konfigurointia

| Asia | Selvitettävä |
|---|---|
| ~~Sopimustyyppi (Urakka)~~ | ~~Ratkaistu: `aud_agreement` = Billing Method, arvot: Fixed Price / Time and Material~~ |
| ~~Roolien kategorisointi~~ | ~~Ratkaistu: käytetään suoraan xPM:n rooleja (`pum_role`), ei mapata~~ |
| ~~Alue-kenttä tehtävissä~~ | ~~Ratkaistu: johdetaan tehtävänimestä / WBS-hierarkiasta~~ |
| ~~ProjectSituation vs SiteSituation~~ | ~~Ratkaistu: ei erotella, kaikki tehtävät yhdessä listassa~~ |
| ~~Action items (muilta vaaditut)~~ | ~~Ratkaistu: PM kirjoittaa vapaa tekstinä~~ |

### Punainen — puuttuu kokonaan

| Asia | Ratkaisu |
|---|---|
| ~~Työturvallisuus-osio~~ | ~~Ratkaistu: vakioteksti + PM kirjoittaa poikkeukset~~ |
| ~~Tilannekuva~~ | ~~Ratkaistu: haetaan xPM:n KPI Statusista (Overall + Comments)~~ |
| ~~xPM ↔ Dynamics -linkki~~ | ~~Ratkaistu: yhdistetään projektinumeron perusteella (ei suoraa lookuppia)~~ |
