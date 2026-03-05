
# TYÖVAIHEILMOITUS

---

## Otsikkotiedot

| | |
|---|---|
| **Päivämäärä / Järj. nro** | 010/2026 |
| **Projektinumero** | PRJ-2024-0158 |
| **Projekti** | Helsingin Musiikkitalo — AV-järjestelmän uusinta |
| **Projektipäällikkö** | Matti Virtanen |
| **Asiakas** | Helsingin Musiikkitalo Oy |
| **Asiakkaan yhteyshenkilö** | Anna Korhonen |
| **Viikko** | Vko 10 / 2026 |
| **Urakka** | Fixed Price |
| **Vaihe** | 3. Execute |
| **Aikataulun edistyminen** | 42 % |

> **Datalähde:** Dynamics `ecr_projectportfolio2` → `account` → `contact` + xPM `pum_statusreporting`. Automaattinen.

---

## Vahvuus (viikko 10)

| Rooli | Henkilöitä |
|---|---|
| AV Installer | 3 |
| AV Installation Manager | 1 |
| AV Consultant | 1 |
| AV Project Manager | 1 |
| **Yhteensä** | **6** |

> **Datalähde:** xPM `pum_gantttask` → `pum_assignment` → `pum_resource` → `pum_role`. Automaattinen.
> Vain Named-resurssit lasketaan, geneerisiä ei.

---

## Projektitilanne

| Tehtävä | Alue | Valmiusaste |
|---|---|---|
| Järjestelmäsuunnittelu | Konserttisali | 100 % |
| Kaapelointi | Konserttisali | 85 % |
| Laitteiden asennus | Konserttisali | 40 % |
| Järjestelmäsuunnittelu | Harjoitussali A | 90 % |
| Kaapelointi | Harjoitussali A | 20 % |
| Ohjelmointi | — | 0 % |
| Käyttöönotto | — | 0 % |

> **Datalähde:** xPM `pum_gantttask` (pum_name, Work, Actual work). Automaattinen.
> Alue johdetaan tehtävänimestä / WBS-hierarkiasta.

---

## Seuraavan 3 viikon aikataulu

| Tehtävä | Alue | Vko 10 | | | | | Vko 11 | | | | | Vko 12 | | | | |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | Ma | Ti | Ke | To | Pe | Ma | Ti | Ke | To | Pe | Ma | Ti | Ke | To | Pe |
| Kaapelointi | Konserttisali | x | x | x | x | x | x | x | | | | | | | | |
| Laitteiden asennus | Konserttisali | | | | | | x | x | x | x | x | x | x | x | x | x |
| Kaapelointi | Harjoitussali A | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x |
| Järjestelmäsuunn. | Harjoitussali A | x | x | | | | | | | | | | | | | |
| Ohjelmointi | — | | | | | | | | | | | x | x | x | x | x |

> **Datalähde:** xPM `pum_gantttask` (pum_startdate, pum_enddate). Automaattinen.

---

## KPI Status

| Dimensio | Nykytila | Ehdotus | Kommentti |
|---|---|---|---|
| Resources | No Issue | No Issue | |
| Summary | No Issue | No Issue | |
| Quality | No Issue | No Issue | |
| Cost | No Issue | At Risk | Materiaalikustannukset ylittymässä 5 % |
| Scope | No Issue | No Issue | |
| Schedule | No Issue | No Issue | |

> **Datalähde:** xPM `pum_statusreporting` (pum_kpicurrent* / pum_kpinew* / pum_kpinew*comment). PM muokkaa ehdotus-saraketta ja kommentteja.

---

## Tilannekuva

Projekti etenee aikataulussa. Konserttisalin kaapelointi valmistuu viikolla 11, minkä jälkeen aloitetaan laitteiden asennus. Kriittinen riski on kaiutintoimitus — jos myöhästyy, vaikuttaa suoraan asennusaikatauluun. Harjoitussali A:n työt käynnistyneet suunnitellusti.

Asiakkaalta tarvitaan lopulliset huoneen mitat Harjoitussali B:lle (DL vk 11). Sähköurakoitsija vetää lisäsyötöt valvomoon viikolla 11.

> **Datalähde:** xPM `pum_statusreporting.pum_comment`. PM kirjoittaa vapaan tilannekuvan, joka kattaa myös action items ja muut huomiot.

---

## Muutokset *(vain Large Initiative)*

| Muutos | Tila | Huomio |
|---|---|---|
| Konserttisalin kaiutinsijoittelu muutettu | Hyväksytty | Vaikuttaa kaapelointiin |
| Harjoitussali A lisänäyttö | Odottaa hyväksyntää | Asiakkaan pyyntö vk 9 |

> **Datalähde:** xPM `pum_changerequest`. Automaattinen. Osio ei näy Small Initiative -projekteissa.

---

## Riskit *(vain Large Initiative, sis. työturvallisuus)*

| Riski | Vaikutus | Todennäköisyys |
|---|---|---|
| Kaiutintoimitus myöhästyy → asennusaikataulu siirtyy | 4/5 | 60 % |
| Harjoitussali A:n lattiaremontti viivästyttää kaapelointia | 3/5 | 30 % |
| Työturvallisuus: putoamisvaara konserttisalin katon asennuksessa | 3/5 | 20 % |

> **Datalähde:** xPM `pum_risk` (Impact, Probability). Automaattinen. Osio ei näy Small Initiative -projekteissa.
> Työturvallisuusriskit kirjataan normaaleina riskeinä xPM:ään.

---

## Datalähde-yhteenveto

| Osio | Automaattinen | PM:n syöte |
|---|---|---|
| Otsikkotiedot | ✅ | — |
| Vahvuus | ✅ | — |
| Projektitilanne | ✅ | — |
| 3 vk aikataulu | ✅ | — |
| KPI Status | ✅ (nykytila) | Ehdotukset + kommentit |
| Tilannekuva | — | ✅ (`pum_comment`) |
| Muutokset | ✅ (vain Large) | — |
| Riskit + työturvallisuus | ✅ (vain Large) | — |
