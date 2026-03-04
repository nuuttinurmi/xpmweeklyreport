
# Projektisuunnitelma: Työvaiheilmoituksen automatisointi

## Yhteenveto

Automatisoidaan viikoittainen työvaiheilmoitus xPM/Dynamics-datalla. PM:n käsityö vähenee ~70 % — automaattiset osiot haetaan lennossa, PM täyttää vain kommentit ja tilannekuvan.

**Kokonaistyömäärä:** 8–12 henkilötyöpäivää (ilman tulostusvaihetta)
**Tulostusvaiheen lisätyö:** 3–5 pv (valitaan vaihe 2:ssa)

---

## Vaihe 1: Pohjatyö (Dataverse + UI)

Tämä vaihe on pakollinen riippumatta tulostustavan valinnasta.

### 1.1 Dataverse-taulut

**Kesto:** 1 pv
**Tekijä:** Dynamics-kehittäjä

Tehtävät:
- [ ] Luo `aud_weeklyreport` -taulu Dataverseen (kentät: Initiative-lookup, WeekNumber, Year, Status, ActionItems, SafetyNotes, SituationSummary, AdditionalInfo, OutputFileUrl)
- [ ] Luo `aud_weeklyreporttasknote` -taulu (kentät: WeeklyReport-lookup, GanttTask-lookup, Notes)
- [ ] Konfiguroi relaatiot: `aud_weeklyreport` → `pum_initiative` (N:1), `aud_weeklyreporttasknote` → `aud_weeklyreport` (N:1), `aud_weeklyreporttasknote` → `pum_gantttask` (N:1)
- [ ] Aseta Status-choice: Luonnos / Valmis / Lähetetty
- [ ] Aseta SafetyNotes-kentän oletusarvo: "Ei poikkeamia"

**Riippuvuudet:** Ei
**Hyväksyntä:** Taulurakenne tarkistettu, taulut näkyvät Dataversessä

---

### 1.2 Initiative-lomakkeen Weekly Reports -välilehti

**Kesto:** 1 pv
**Tekijä:** Dynamics-kehittäjä

Tehtävät:
- [ ] Lisää `pum_initiative` -lomakkeelle uusi välilehti "Weekly Reports"
- [ ] Lisää subgrid `aud_weeklyreport`-tietueista (sarakkeet: Vko, Vuosi, Status, Luotu, PDF-linkki)
- [ ] Konfiguroi subgridin filtteri: näytä vain tämän initiativen raportit
- [ ] Lisää "New Report" -painike subgridiin

**Riippuvuudet:** 1.1 valmis
**Hyväksyntä:** Välilehti näkyy initiative-lomakkeella, subgrid toimii

---

### 1.3 WeeklyReport-lomake

**Kesto:** 1–2 pv
**Tekijä:** Dynamics-kehittäjä

Tehtävät:
- [ ] Luo `aud_weeklyreport` -lomake (model-driven app)
- [ ] Ylä-osa: Initiative-linkki, viikko, vuosi, status (read-only paitsi status)
- [ ] PM:n syöttökentät: ActionItems (multiline), SafetyNotes (multiline, oletusteksti), SituationSummary (multiline), AdditionalInfo
- [ ] Subgrid: `aud_weeklyreporttasknote` -rivit (sarakkeet: tehtävän nimi, Notes)
- [ ] "Generoi PDF" -painike (command bar button → laukaisee Power Automate)
- [ ] Business rule: kun Status = Valmis, PM:n syöttökentät read-only

**Riippuvuudet:** 1.1 valmis
**Hyväksyntä:** PM voi avata lomakkeen, täyttää kentät, tallentaa

---

### 1.4 Power Automate: Raportin luonti

**Kesto:** 2–3 pv
**Tekijä:** Power Automate -kehittäjä

Tehtävät:
- [ ] Flow 1 — "Luo viikkoraportti" (laukaistaan painikkeesta tai ajastettuna):
  - Luo `aud_weeklyreport`-tietue (viikko, vuosi, initiative-linkki)
  - Hae projektin aktiiviset tehtävät: `pum_gantttask` (filtteri: initiative + aktiivinen aikajänne)
  - Luo `aud_weeklyreporttasknote`-rivi per tehtävä (GanttTask-lookup täytettynä, Notes tyhjä)
  - Kopioi edellisen viikon Notes-kentät uusille riveille (jos sama tehtävä jatkuu)
- [ ] Testaa eri projekteilla: projekti jossa 5 tehtävää, 15 tehtävää, 0 tehtävää
- [ ] Virheenkäsittely: duplikaattisuoja (sama viikko + initiative = virhe)

**Riippuvuudet:** 1.1 valmis
**Hyväksyntä:** Raportti luodaan oikein, tehtävärivit syntyvät, edellisen viikon kommentit kopioituvat

---

### 1.5 Testaus ja pilotti

**Kesto:** 2–3 pv
**Tekijä:** PM (pilottikäyttäjä) + kehittäjä

Tehtävät:
- [ ] Valitse 2–3 pilottiprojektia (eri kokoluokkaa)
- [ ] PM testaa koko prosessin: luo raportti → täytä kommentit → tallenna
- [ ] Tarkista automaattisen datan oikeellisuus (vahvuus, tehtävät, valmiusaste)
- [ ] Kerää palaute PM:ltä: puuttuuko kenttiä, onko jotain turhaa, onko käyttökokemus OK?
- [ ] Korjaa löydetyt ongelmat

**Riippuvuudet:** 1.1–1.4 valmiit
**Hyväksyntä:** PM hyväksyy, data on oikein

---

## Vaihe 2: Tuloste (PDF / portaali)

Aloitetaan kun vaihe 1 on hyväksytty ja pilotin palaute käsitelty. Tulostustapa valitaan pilotin tulosten perusteella.

### Vaihtoehto A: Paginated Report

**Kesto:** 3–5 pv
**Tekijä:** Power BI -kehittäjä

Tehtävät:
- [ ] Luo Paginated Report (RDL) Power BI Report Builderilla
- [ ] Parametri: Initiative ID (tai projektinumero)
- [ ] Datayhteydet Dataverseen: otsikkotiedot, vahvuus, tehtävät, aikataulu, riskit, muutokset, PM:n kommentit
- [ ] Layout: otsikkotiedot, vahvuustaulukko, tehtävälista, 3 vk Ma–Pe -ruudukko, muuta-osio
- [ ] Julkaise Power BI Serviceen
- [ ] Power Automate -flow: "Generoi PDF" -painike → Export Paginated Report → PDF → SharePoint
- [ ] Testaa eri projekteilla

### Vaihtoehto B: Word-template

**Kesto:** 2–3 pv
**Tekijä:** Power Automate -kehittäjä

Tehtävät:
- [ ] Suunnittele Word-template (kenttämerkit, Repeating Section)
- [ ] Power Automate: Populate Word template → Convert to PDF → SharePoint
- [ ] Testaa eri projekteilla

### Vaihtoehto C: Canvas App

**Kesto:** 4–6 pv
**Tekijä:** Canvas App -kehittäjä

Tehtävät:
- [ ] Rakenna Canvas App joka hakee datan ja renderöi raportin
- [ ] PDF()-generointi → SharePoint
- [ ] Testaa eri projekteilla

---

## Vaihe 3: Käyttöönotto ja jatkokehitys

**Kesto:** 1–2 pv

Tehtävät:
- [ ] Ohjeista PM:t (lyhyt opas / video)
- [ ] Ota käyttöön kaikille aktiivisille projekteille
- [ ] Sovi jatkokehitystoiveiden keräysprosessi

---

## Aikataulu

```
Viikko 1            Viikko 2            Viikko 3
──────────────────  ──────────────────  ──────────────────
1.1 Taulut (1 pv)
1.2 Välilehti (1 pv)
1.3 Lomake (2 pv)
                    1.4 Power Automate (3 pv)
                    1.5 Testaus + pilotti (3 pv)
                                        2.x Tuloste (3–5 pv)
                                        3.  Käyttöönotto (1 pv)
```

**Kokonaisaikataulu:** ~3 viikkoa (1 henkilö) tai ~2 viikkoa (2 henkilöä rinnakkain)

---

## Riskit

| Riski | Todennäköisyys | Vaikutus | Mitigaatio |
|---|---|---|---|
| xPM:n tauluihin ei pääse kirjoittamaan (pum_initiative lomake-muokkaus) | Keskitason | Korkea | Tarkista Projectum-lisenssin ehdot ja admin-oikeudet ennen aloitusta |
| Power Automate -flow on liian hidas isoilla projekteilla (paljon tehtäviä) | Matala | Keskitason | Rajaa tehtävien määrä (vain aktiiviset / WBS-taso 1–2) |
| PM:t eivät ota uutta prosessia käyttöön | Keskitason | Korkea | Pilotoi 2–3 PM:n kanssa, kerää palaute, iteroi ennen laajaa käyttöönottoa |

---

## Aloitusedellytykset

Ennen aloitusta tarkistettava:

- [ ] **Pääsy xPM:n konfigurointiin:** Voidaanko `pum_initiative` -lomaketta muokata (uusi välilehti)?
- [ ] **Dataverse-oikeudet:** Voiko luoda uusia tauluja (`aud_`-prefixillä) samaan ympäristöön?
- [ ] **Power Automate -lisenssi:** Premium-connector (Dataverse) käytettävissä?
- [ ] **Pilottiprojektit valittu:** 2–3 projektia eri kokoluokkaa, PM:t sitoutuneet testaamaan
