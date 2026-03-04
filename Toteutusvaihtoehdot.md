
# Toteutusvaihtoehdot — Työvaiheilmoituksen generointi

Kaikissa vaihtoehdoissa data on samassa Dataverse-ympäristössä (xPM `pum_`-taulut + Dynamics-taulut). Ero on siinä, miten raportti rakennetaan, miten PM syöttää käsin täytettävät tiedot, ja miten asiakas näkee lopputuloksen.

---

## Vaihtoehto 1: Power BI Paginated Report

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────┐
│                    DATAVERSE                         │
│  pum_initiative, pum_gantttask, pum_assignment,     │
│  pum_resource, pum_role, pum_risk,                  │
│  pum_changerequest, ecr_projectportfolio2,          │
│  account, contact, WorkPhaseReport (uusi)           │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌───────▼────────────┐
    │  Model-driven app   │  │  Paginated Report   │
    │  (PM:n syöttölomake)│  │  (Report Builder)   │
    │                     │  │                     │
    │  - Huomioitavaa     │  │  - Hakee kaiken     │
    │  - Action items     │  │    datan Dataverse-  │
    │  - Tilannekuva      │  │    stä (auto +      │
    │  - Työturvallisuus  │  │    PM:n syötteet)   │
    └─────────────────────┘  └──────────┬──────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  Power BI Service  │
                              │  (Premium)         │
                              ├────────┬───────────┤
                              │        │           │
                     ┌────────▼──┐  ┌──▼─────────┐
                     │ Portaali   │  │ PDF-vienti │
                     │ (selain)   │  │ (automaatt)│
                     └────────────┘  └─────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │ SharePoint  │
                                    │ + sähköposti│
                                    └─────────────┘
```

### PM:n syöttö
- PM avaa WorkPhaseReport-lomakkeen Dynamicsissa (model-driven app)
- Automaattiset kentät (otsikkotiedot, vahvuus, tehtävät, aikataulu, riskit, muutokset) ovat valmiiksi täytetty (Power Automate flow täyttää ne viikoittain)
- PM täyttää käsin: Huomioitavaa-sarake riveille, Action items, Tilannekuva, Työturvallisuuspoikkeukset
- PM painaa "Generoi raportti" → Power Automate laukaisee Paginated Reportin PDF-viennin

### Asiakasnäkymä
- **PDF:** Tallennetaan automaattisesti projektin SharePoint-kirjastoon, voidaan lähettää sähköpostilla
- **Portaali:** Paginated Report voidaan upottaa Power BI -työtilanäkymään tai suoraan Dynamics-lomakkeelle iframe-komponentilla. Parametrina projektinumero.
- **Power Pages (valinnainen):** Jos halutaan ulkoinen portaali asiakkaalle, Power BI -raportti voidaan upottaa Power Pages -sivulle

### Työmäärä

| Komponentti | Arvioitu työ | Huomio |
|---|---|---|
| WorkPhaseReport-entiteetti + alirivit Dataverseen | 1–2 pv | Taulut, kentät, relaatiot |
| Model-driven app -lomake PM:lle | 1–2 pv | Lomake, näkymät, business rules |
| Power Automate: datan esitäyttö | 2–3 pv | Hae xPM + Dynamics data → täytä WorkPhaseReport |
| Paginated Report (RDL) | 3–5 pv | Report Builder, layout, parametrit, subreportit |
| Power Automate: PDF-vienti + SharePoint | 1 pv | Export to file + tallenna |
| Testaus ja viimeistely | 2–3 pv | |
| **Yhteensä** | **10–16 pv** | |

### Ylläpito
- Paginated Report: RDL-tiedosto, muutokset Report Builderilla
- Jos kenttiä lisätään/poistetaan → päivitettävä sekä lomake että raportti
- Power BI Premium -lisenssi vaaditaan jatkuvasti

---

## Vaihtoehto 2: Model-driven app + Word-template → PDF

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────┐
│                    DATAVERSE                         │
│  (samat taulut kuin vaihtoehto 1)                   │
│  + WorkPhaseReport (uusi)                           │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │  Model-driven app               │
    │  (PM:n syöttölomake             │
    │   + raportin selausnäkymä)      │
    │                                 │
    │  PM täyttää käsin kentät        │
    │  → painaa "Generoi PDF"         │
    └──────────────┬──────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Power Automate   │
         │                   │
         │  1. Hae data      │
         │  2. Täytä Word-   │
         │     template      │
         │  3. Word → PDF    │
         │  4. Tallenna SP   │
         └─────────┬─────────┘
                   │
            ┌──────▼──────┐
            │ SharePoint  │
            │ + sähköposti│
            └─────────────┘
```

### PM:n syöttö
- Sama kuin vaihtoehto 1: model-driven app -lomake Dynamicsissa
- Automaattiset kentät esitäytetty, PM täyttää loput
- "Generoi PDF" -painike laukaisee Power Automate flown

### Asiakasnäkymä
- **PDF:** Word-template → PDF → SharePoint / sähköposti
- **Portaali:** Dynamics-lomake itsessään (vaatii käyttäjätunnuksen) TAI Power Pages -portaali jossa luetaan WorkPhaseReport-dataa suoraan Dataversestä (ei PDF:ää, vaan dynaaminen sivu)

### Työmäärä

| Komponentti | Arvioitu työ | Huomio |
|---|---|---|
| WorkPhaseReport-entiteetti + alirivit | 1–2 pv | Sama kuin VE1 |
| Model-driven app -lomake | 1–2 pv | Sama kuin VE1 |
| Power Automate: datan esitäyttö | 2–3 pv | Sama kuin VE1 |
| Word-template | 2–3 pv | Template-suunnittelu, kenttien mappaus. 3 vk ruudukko haasteellinen. |
| Power Automate: Word → PDF → SharePoint | 1 pv | Populate Word template + Convert file |
| Testaus ja viimeistely | 2 pv | |
| **Yhteensä** | **9–13 pv** | |

### Ylläpito
- Word-template: helppo muokata Wordissa
- Rajoitus: Word-templaten taulukot ovat staattisia — dynaaminen rivimäärä vaatii Repeating Section -kenttien käyttöä (toimii mutta kömpelöä)
- 3 viikon Ma–Pe -ruudukko vaikeasti toteutettavissa Wordissa dynaamisesti

---

## Vaihtoehto 3: Canvas App + PDF()

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────┐
│                    DATAVERSE                         │
│  (samat taulut)                                     │
│  + WorkPhaseReport (uusi)                           │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │  Canvas App                      │
    │                                  │
    │  - Hakee datan suoraan           │
    │    Dataversestä                  │
    │  - Renderöi raportin             │
    │    näytölle (portaalinäkymä)     │
    │  - PM täyttää käsin kentät       │
    │    samassa sovelluksessa         │
    │  - PDF() → tallenna SharePoint   │
    └──────────────┬───────────────────┘
                   │
            ┌──────▼──────┐
            │ SharePoint  │
            │ + sähköposti│
            └─────────────┘
```

### PM:n syöttö
- Kaikki yhdessä Canvas Appissa: automaattiset kentät + käsin täytettävät
- PM näkee suoraan miltä raportti näyttää (WYSIWYG)
- Voi editoida ja nähdä muutokset reaaliajassa

### Asiakasnäkymä
- **PDF:** `PDF(Screen)` → tallenna SharePointiin tai lähetä sähköpostilla
- **Portaali:** Canvas App voidaan jakaa linkkinä (guest access) tai upottaa Power Pagesiin
- WYSIWYG: asiakas näkee saman näkymän kuin PM

### Työmäärä

| Komponentti | Arvioitu työ | Huomio |
|---|---|---|
| WorkPhaseReport-entiteetti + alirivit | 1–2 pv | Sama kuin muut |
| Power Automate: datan esitäyttö | 2–3 pv | Sama kuin muut |
| Canvas App: UI-suunnittelu | 4–6 pv | Layoutin rakentaminen näytöille, responsiivisuus |
| Canvas App: datayhteydet + logiikka | 2–3 pv | Dataverse-kyselyt, galleriat, lomakekentät |
| PDF()-generointi + SharePoint-tallennus | 1 pv | |
| Testaus ja viimeistely | 2–3 pv | |
| **Yhteensä** | **12–18 pv** | |

### Ylläpito
- Canvas App: visuaalinen editori, helppo muokata
- PDF()-funktion rajoitukset: max 1 näyttö kerrallaan, ei sivunumerointia, ei header/footer
- Monimutkaisemmilla raporteilla voi tulla layout-ongelmia tulostuksessa

---

## Vertailutaulukko

| Kriteeri | Paginated Report | Model-driven + Word | Canvas App |
|---|---|---|---|
| **PDF-laatu** | ⭐⭐⭐ Pixel-perfect | ⭐⭐ Hyvä, rajoitettu layout | ⭐ Perus, ei sivutusta |
| **Portaalinäkymä** | ⭐⭐⭐ Power BI embed | ⭐⭐ Dynamics-lomake / Power Pages | ⭐⭐⭐ Natiivinäkymä |
| **PM:n syöttökokemus** | ⭐⭐ Erillinen lomake | ⭐⭐ Erillinen lomake | ⭐⭐⭐ Kaikki samassa |
| **3 vk ruudukko** | ⭐⭐⭐ Helppo toteuttaa | ⭐ Vaikea Wordissa | ⭐⭐ Mahdollinen |
| **Työmäärä** | 10–16 pv | 9–13 pv | 12–18 pv |
| **Ylläpito** | Report Builder (vanha) | Word (helppo) | Canvas editor (helppo) |
| **Lisenssit** | Premium (on jo) | Ei lisäkustannuksia | Ei lisäkustannuksia |
| **Skaalautuvuus** | ⭐⭐⭐ Kymmeniä projekteja | ⭐⭐ Hyvä | ⭐⭐ Hyvä |

---

## Suositus

**Vaihtoehto 1 (Paginated Report)** on kokonaisuutena paras koska:
- PDF-laatu on paras (pixel-perfect, sivutus, header/footer)
- Sama raportti toimii sekä portaalissa että PDF:nä
- 3 viikon aikatauluruudukko toteutuu luontevasti
- Premium-lisenssi on jo käytössä
- Skaalautuu hyvin kymmenille projekteille

**Vaihtoehto 2 (Word-template)** on nopein rakentaa, mutta 3 viikon ruudukko on ongelma. Hyvä vaihtoehto jos layout pidetään yksinkertaisena.

**Vaihtoehto 3 (Canvas App)** on paras PM-kokemus (WYSIWYG), mutta PDF-laatu heikoin. Hyvä valinta jos portaalinäkymä on pääasia ja PDF toissijainen.

### Yhdistelmävaihtoehto (Paginated + Model-driven)

Käytännössä **kaikissa vaihtoehdoissa tarvitaan sama pohjatyö:**
1. WorkPhaseReport-entiteetti Dataverseen
2. Power Automate -flow datan esitäyttöön
3. Model-driven app -lomake PM:n syöttöä varten

Ero on vain **tulostusvaiheessa** (Paginated Report vs Word vs Canvas PDF).
Pohjatyö (kohdat 1–3) kannattaa tehdä ensin, ja tulostustapa valita sen jälkeen.
