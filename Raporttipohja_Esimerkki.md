
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
| **Lisätietoja** | — |

> **Datalähde:** Dynamics `ecr_projectportfolio2` → `account` → `contact`. Automaattinen.

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

| Tehtävä | Alue | Valmiusaste | Huomioitavaa |
|---|---|---|---|
| Järjestelmäsuunnittelu | Konserttisali | 100 % | Valmis |
| Kaapelointi | Konserttisali | 85 % | Muutama veto jäljellä |
| Laitteiden asennus | Konserttisali | 40 % | Odottaa kaiutintoimitusta |
| Järjestelmäsuunnittelu | Harjoitussali A | 90 % | Tarkistus kesken |
| Kaapelointi | Harjoitussali A | 20 % | Aloitettu vk 9 |
| Ohjelmointi | — | 0 % | Alkaa vk 12 |
| Käyttöönotto | — | 0 % | Alkaa vk 14 |

> **Datalähde:** xPM `pum_gantttask` (pum_name, Work, Actual work). Automaattinen.
> Alue johdetaan tehtävänimestä / WBS-hierarkiasta.
> "Huomioitavaa" = PM kirjoittaa käsin.

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

## Muuta

### Muilta osapuolilta vaaditut toimenpiteet
- Asiakas: Toimittaa lopulliset huoneen mitat Harjoitussali B:lle (DL vk 11)
- Sähköurakoitsija: Vetää lisäsyötöt valvomoon (sovittu vk 11)

> PM kirjoittaa käsin.

---

### Muutokset
| Muutos | Tila | Huomio |
|---|---|---|
| Konserttisalin kaiutinsijoittelu muutettu | Hyväksytty | Vaikuttaa kaapelointiin |
| Harjoitussali A lisänäyttö | Odottaa hyväksyntää | Asiakkaan pyyntö vk 9 |

> **Datalähde:** xPM `pum_changerequest` (projektin muutospyynnöt). Automaattinen.

---

### Riskit
| Riski | Vaikutus | Todennäköisyys |
|---|---|---|
| Kaiutintoimitus myöhästyy → asennusaikataulu siirtyy | 4/5 | 60 % |
| Harjoitussali A:n lattiaremontti viivästyttää kaapelointia | 3/5 | 30 % |

> **Datalähde:** xPM `pum_risk` (Impact, Probability). Automaattinen.

---

### Työturvallisuus

Ei poikkeamia.

> Vakioteksti. PM lisää poikkeukset tarvittaessa.

---

### Vapaa teksti / tilannekuva

Projekti etenee aikataulussa. Konserttisalin kaapelointi valmistuu viikolla 11, minkä jälkeen aloitetaan laitteiden asennus. Kriittinen riski on kaiutintoimitus — jos myöhästyy, vaikuttaa suoraan asennusaikatauluun. Harjoitussali A:n työt käynnistyneet suunnitellusti.

> PM kirjoittaa käsin (tai Loop-linkki).

---

## Datalähde-yhteenveto

| Osio | Automaattinen | Käsin |
|---|---|---|
| Otsikkotiedot | ✅ | Lisätietoja (harvoin) |
| Vahvuus | ✅ | — |
| Projektitilanne | ✅ Tehtävä, alue, valmiusaste | Huomioitavaa |
| 3 vk aikataulu | ✅ | — |
| Action items | — | ✅ |
| Muutokset | ✅ | — |
| Riskit | ✅ | — |
| Työturvallisuus | ✅ Vakioteksti | Poikkeukset |
| Tilannekuva | — | ✅ |
