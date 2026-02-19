
# Työvaiheilmoituksen automatisointi xPM/Dynamics-datalla

## Tausta ja tavoite
Tämän dokumentin tarkoituksena on kuvata, miten nykyinen **OP_Työvaiheilmoituspohja.xlsx** automatisoidaan mahdollisimman pitkälle **Dynamics 365 / xPM** -datalla siten, että:
- manuaalinen työ minimoituu
- tieto on rakenteista ja uudelleenkäytettävää
- raportit ovat Copilotin ja muiden AI-ratkaisujen löydettävissä

Lopputuloksena työvaiheilmoitus **generoidaan**, sitä ei kirjoiteta käsin.

---

## 1. Kenttä–kenttä-mapping (Excel → xPM/Dynamics)

### 1.1 Otsikkotiedot (100 % automaattiset)

| Excel-kenttä | Lähde xPM/Dynamicsissa | Huomio |
|-------------|-----------------------|--------|
| Päivämäärä / järj. nro | Generoitu | Juokseva nro + vuosi (esim. 004/2025) |
| Projektinumero | Project ID | Sama avain kaikissa raporteissa |
| Projekti | Project Name |  |
| Projektipäällikkö | Project Manager |  |
| Asiakas | Account |  |
| Asiakkaan yhteyshenkilö | Stakeholder |  |
| Viikko | ISO-viikko | Automaattinen |
| Urakka | Contract Type | Kiinteä / T&M / muu |
| Lisätietoja | Optional text | Harvoin käsin |

---

### 1.2 Vahvuus (0 + 2 + 1)

Lasketaan automaattisesti raporttiviikolle:
- Asennus
- Suunnittelu
- Projektinjohto

Lähteenä:
- resurssivaraus
- työpakettien vastuuroolit
- aikakirjausdata (jos saatavilla)

Tulostus säilytetään nykyisessä muodossa (esim. `0 + 2 + 1`).

---

### 1.3 Projektitilanne ja työmaatila

Perustuvat xPM:n tehtäviin / työpaketteihin.

Kentät:
- Tehtävä
- Alue
- Valmiusaste (%)
- Huomioitavaa

Erotellaan rivit tyypin mukaan:
- ProjectSituation
- SiteSituation

---

### 1.4 Seuraavan kolmen viikon aikataulu

Generoidaan xPM:n aikataulu/Gantt-datasta:
- planned start / end
- osuminen viikoille N, N+1, N+2

Excelissä tämä renderöidään tuttuun Ma–Pe -ruudukkoon.

---

### 1.5 MUUTA-osio

Jaetaan kahteen osaan:

**Rakenteinen (xPM/Dynamics):**
- Muilta osapuolilta vaaditut toimenpiteet (Action items)
- Havaitut virheet / puutteet (Issues)
- Tulevat materiaalikuljetukset (Deliveries)
- Työturvallisuus (Safety notes)

**Vapaa teksti:**
- Lyhyt tilannekuva (optionaalisesti Loop-linkki)

---

## 2. xPM / Dataverse -tietomalli

### 2.1 Pääentiteetti: WorkPhaseReport

Kentät:
- Report ID
- Project (lookup)
- Customer
- Customer Contact
- WeekNumber
- Year
- ReportDate
- SequenceNumber
- ContractType
- AdditionalInfo
- SignatureName
- OutputFileUrl (SharePoint)

---

### 2.2 Alirivit

**WorkPhaseReportLine**
- Report
- LineType (ProjectSituation / SiteSituation)
- TaskName
- Area
- CompletionPct
- Notes

**WorkPhaseScheduleLine**
- Report
- WeekNumber
- TaskName
- Area
- Mon–Fri (boolean)

**WorkPhaseOtherSection**
- RequiredActionsFromOthers
- IssuesAndDefects
- UpcomingDeliveries
- SafetyNotes
- OtherNotes

---

## 3. Automaatio- ja prosessiketju

1. Raportti luodaan viikolle (ajastettu tai PM:n toimesta)
2. Data haetaan xPM/Dynamicsista
3. Excel-pohja täytetään automaattisesti
4. Excel renderöidään PDF:ksi
5. PDF tallennetaan projektin SharePoint-kirjastoon
6. SharePoint-URL linkitetään takaisin xPM:ään

Excel toimii vain **esitysmuotona**, ei tiedon lähteenä.

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
