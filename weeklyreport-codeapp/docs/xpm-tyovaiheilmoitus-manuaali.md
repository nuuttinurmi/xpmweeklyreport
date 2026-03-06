# xPM Työvaiheilmoitus – Käyttöohje

Tämä ohje on tarkoitettu Audicon projektipäälliköille, jotka käyttävät työvaiheilmoitussovellusta viikkoraporttien luomiseen ja hallintaan.

---

## Sisällysluettelo

1. [Yleiskatsaus](#1-yleiskatsaus)
2. [Sovelluksen avaaminen](#2-sovelluksen-avaaminen)
3. [Raportin valitseminen](#3-raportin-valitseminen)
4. [Raporttinäkymä](#4-raporttinäkymä)
5. [Raportin osiot](#5-raportin-osiot)
6. [Kieliversiot](#6-kieliversiot)
7. [KPI-tilanteen päivittäminen](#7-kpi-tilanteen-päivittäminen)
8. [Tallentaminen ja tulostaminen](#8-tallentaminen-ja-tulostaminen)

---

## 1. Yleiskatsaus

### Mikä on työvaiheilmoitus?

Työvaiheilmoitus on xPM-järjestelmään integroitu sovellus, joka tuottaa viikkokohtaisen tilannekatsauksen projektista. Raportti kokoaa automaattisesti tietoja xPM:stä ja täydentää niitä projektipäällikön omilla kommenteilla ja KPI-arvioilla.

### Raportin sisältö

Työvaiheilmoitus sisältää seuraavat tiedot:

| Osio | Sisältö | Lähde |
|------|---------|-------|
| **Projektin perustiedot** | Nimi, asiakas, projektinumero, vaihe, aikataulun edistyminen | xPM (automaattinen) |
| **Vahvuus** | Viikon resurssit nimettynä | xPM (automaattinen) |
| **3 viikon aikataulu** | Tehtävät ja niiden ajoitus päivätasolla | xPM (automaattinen) |
| **Tilanne ja kommentit** | Projektipäällikön kommentti ja KPI-arviot | Manuaalinen syöttö |
| **Muutokset** | Muutospyynnöt ja niiden tila | xPM (automaattinen, vain Large Initiative) |
| **Riskit** | Aktiiviset riskit, vaikutus ja todennäköisyys | xPM (automaattinen, vain Large Initiative) |

### Projektityyppien erot

- **Large Initiative** – Raportti sisältää kaikki osiot, mukaan lukien muutokset ja riskit
- **Small Initiative** – Raportti sisältää perustiedot, vahvuuden, aikataulun ja KPI-tilanteen. Muutoksia ja riskejä ei näytetä.

---

## 2. Sovelluksen avaaminen

1. Avaa selaimessa työvaiheilmoitussovelluksen osoite
2. Kirjaudu sisään Microsoft 365 -tunnuksillasi
3. Sovellus avautuu raporttivalintanäkymään

> **Huomio:** Sovellus käyttää samoja Microsoft 365 -tunnuksia kuin xPM. Erillistä kirjautumista ei tarvita.

---

## 3. Raportin valitseminen

### Projektin ja raportin valinta

1. Valitse **projekti** pudotusvalikosta
2. Projektin statusraportit näytetään listana
3. Klikkaa haluttua raporttia avataksesi sen muokattavaksi

Listauksessa näkyy kunkin raportin:

- **Päivämäärä** – Raportin statuspäivä
- **Tila** – Aktiivinen (muokattavissa) tai lukittu

> **Vinkki:** Viimeisin raportti on yleensä listan ylimpänä.

---

## 4. Raporttinäkymä

### Työkalupalkki

Raporttinäkymän yläosassa on työkalupalkki, joka sisältää:

| Painike | Toiminto |
|---------|----------|
| **Takaisin** | Palaa raporttivalintaan |
| **Kielivalitsin** (EN/FI/SV) | Vaihtaa raportin kielen |
| **Tallenna** | Tallentaa muutokset Dataverseen |
| **Tulosta / Esikatselu** | Avaa selaimen tulostusnäkymä |
| **Luo PDF** | Käynnistää PDF-generoinnin SharePointiin (jos konfiguroitu) |

> **Huomio:** Tallenna-painike on aktiivinen vain kun raporttia on muokattu. Muokkaamaton raportti näkyy ilman tallennuspainiketta.

### Raportin tila

- **Aktiivinen raportti** – Kaikki kentät ovat muokattavissa
- **Lukittu raportti** – Kentät näytetään vain luku -tilassa. Lukittu raportti on jo lähetetty tai hyväksytty.

Raportin muokkaustila näkyy otsikkopalkin vieressä: oranssi piste tarkoittaa tallentamattomia muutoksia.

---

## 5. Raportin osiot

### Projektin perustiedot

Raportin yläosa näyttää projektin perustiedot taulukkomuodossa:

| Kenttä | Kuvaus |
|--------|--------|
| **Päivämäärä** | Statusraportin päivämäärä |
| **Projektinumero** | Projektin numero (xPM:stä) |
| **Projekti** | Projektin nimi |
| **Asiakas** | Asiakkaan nimi |
| **Vaihe** | Projektin nykyinen vaihe (esim. 1. Initiate, 3. Execute) |
| **Aikataulun edistyminen** | Prosenttiluku, kuinka pitkällä projekti on |

Nämä tiedot haetaan automaattisesti xPM:stä. Niitä ei voi muokata raportissa.

### Vahvuus

Vahvuus-osio listaa nimetyt resurssit, jotka on kohdistettu raportin viikon tehtäviin.

- Resurssit haetaan xPM:n tehtäväkohdistuksista
- Vain **nimetyt resurssit** näytetään (geneeriset resurssit suodatetaan pois)
- Lista on aakkosjärjestyksessä
- Raportti näyttää resurssien kokonaislukumäärän

> **Huomio:** Jos viikon tehtävillä ei ole resursseja, osio näyttää "Ei resursseja tälle viikolle."

### 3 viikon aikataulu

Aikatauluosio näyttää tehtävät kolmen viikon ajalta: edellinen viikko, kuluva viikko ja seuraava viikko.

| Sarake | Kuvaus |
|--------|--------|
| **Tehtävä** | Tehtävän nimi xPM:stä |
| **Alue** | WBS-alue (ylätason tehtävä) |
| **Viikonpäivät** (Ma–Pe) | Aktiiviset päivät merkitty mustalla |

Tehtävät, jotka eivät osu kolmen viikon ikkunaan, suodatetaan automaattisesti pois.

### Tilanne ja kommentit

Tämä on raportin ainoa manuaalisesti täytettävä osio. Se sisältää:

#### Kommentti / Tilanteen yhteenveto

Vapaamuotoinen tekstikenttä, johon projektipäällikkö kirjoittaa lyhyen kuvauksen projektin tilanteesta, kriittisistä asioista ja seuraavista askeleista.

#### KPI-tilanne

Katso [luku 7: KPI-tilanteen päivittäminen](#7-kpi-tilanteen-päivittäminen).

### Muutokset (vain Large Initiative)

Muutososio näyttää projektin muutospyynnöt xPM:stä:

| Sarake | Kuvaus |
|--------|--------|
| **Muutos** | Muutospyynnön nimi |
| **Tila** | Avoin, Hyväksytty, Hylätty tai Odottaa hyväksyntää |
| **Huomio** | Muutospyynnön kuvaus |

### Riskit (vain Large Initiative)

Riskiosio näyttää projektin aktiiviset riskit:

| Sarake | Kuvaus |
|--------|--------|
| **Riski** | Riskin nimi ja kuvaus |
| **Vaikutus** | 1 - Very Low ... 5 - Very High |
| **Todennäköisyys** | 10 % ... 90 % |

---

## 6. Kieliversiot

Raportti tukee kolmea kieltä:

| Koodi | Kieli |
|-------|-------|
| **EN** | Englanti |
| **FI** | Suomi |
| **SV** | Ruotsi |

### Kielen vaihtaminen

1. Valitse työkalupalkista kielivalitsin (EN/FI/SV)
2. Raportin kaikki otsikot, sarakkeiden nimet ja painikkeet vaihtuvat valitulle kielelle

> **Huomio:** Kieli vaikuttaa vain raportin UI-teksteihin (otsikot, taulukon sarakkeet, KPI-nimet, painikkeet). Projektin datasisältö (tehtävien nimet, kommentit, riskien kuvaukset) säilyy alkuperäisellä kielellään.

Valittu kieli näkyy myös tulosteessa ja PDF:ssä. Valitse siis oikea kieli ennen tulostamista.

---

## 7. KPI-tilanteen päivittäminen

### KPI-ulottuvuudet

KPI-taulussa on kuusi ulottuvuutta:

| Ulottuvuus | Kuvaus |
|------------|--------|
| **Yhteenveto** | Kokonaistilanne (yhdistetieto, ei kommenttia) |
| **Resurssit** | Onko resursseja riittävästi ja saatavilla |
| **Laatu** | Täyttääkö tuotos laatuvaatimukset |
| **Kustannus** | Pysytäänkö budjetissa |
| **Laajuus** | Pysytäänkö sovitussa laajuudessa |
| **Aikataulu** | Pysytäänkö aikataulussa |

Yhteenveto-rivi on ylimpänä ja visuaalisesti eroteltu muista riveistä.

### Sarakkeet

| Sarake | Kuvaus |
|--------|--------|
| **Nykyinen** | xPM:n tämänhetkinen arvo (ei muokattavissa) |
| **Ehdotettu** | Projektipäällikön ehdottama uusi arvo |
| **Huomio** | Vapaamuotoinen kommentti (ei Yhteenveto-rivillä) |

### KPI-arvot

Jokaiselle ulottuvuudelle valitaan yksi neljästä arvosta:

| Arvo | Merkitys |
|------|----------|
| Ei asetettu | Ei arvioitu |
| Tarvitsee apua | Kriittinen tilanne, tarvitaan tukea |
| Riskissä | Tilanne vaatii huomiota |
| Ei ongelmaa | Kaikki kunnossa |

### KPI-arvojen päivittäminen

1. Valitse **Ehdotettu**-sarakkeen pudotusvalikosta uusi arvo kullekin ulottuvuudelle
2. Kirjoita tarvittaessa **Huomio**-kenttään selitys
3. Tallenna raportti

> **Vinkki:** Päivitä KPI-tilanne aina ennen raportin lähettämistä. Ehdotetut arvot siirtyvät nykyisiksi arvoiksi kun raportti hyväksytään xPM:ssä.

---

## 8. Tallentaminen ja tulostaminen

### Tallentaminen

- Klikkaa **Tallenna**-painiketta työkalupalkissa
- Tallentamaton muutos näkyy otsikkorivin oranssina pisteenä
- Tallennus kirjoittaa tiedot suoraan Dataverseen (xPM:n tietokantaan)

> **Huomio:** Jos suljet selaimen tallentamatta, muutokset häviävät.

### Tulostaminen / PDF

1. Valitse oikea kieli kielivalitsimesta
2. Klikkaa **Tulosta / Esikatselu** -painiketta
3. Selain avaa tulostuksen esikatselun
4. Valitse tulostimeksi **Save as PDF** tai oikea tulostin
5. Klikkaa **Tulosta**

Tulosteessa:

- Työkalupalkki ja muokkauselementit piilotetaan automaattisesti
- KPI-taulukon pudotusvalikot korvataan tekstiarvoilla
- Logo ja otsikko näytetään sivun yläosassa

### PDF-generointi SharePointiin

Jos organisaatiossasi on konfiguroitu Power Automate -flow:

1. Tallenna raportti ensin
2. Klikkaa **Luo PDF** -painiketta
3. Sovellus lähettää raportin tiedot Power Automate -flow'lle
4. Flow generoi PDF:n ja tallentaa sen projektin SharePoint-sivustolle

> **Huomio:** Luo PDF -painike on käytössä vain jos Power Automate -flow on määritetty sovelluksen asetuksissa.

---

## Usein kysytyt kysymykset

### Miksi vahvuuslistalla ei näy kaikkia tiimin jäseniä?

Vahvuus näyttää vain ne resurssit, jotka on kohdistettu raportin viikon tehtäviin xPM:n aikataulussa. Jos henkilöä ei ole kohdistettu viikon tehtäviin, hän ei näy listalla.

### Miksi muutokset ja riskit eivät näy?

Muutokset ja riskit näytetään vain **Large Initiative** -tyyppisille projekteille. Small Initiative -projekteissa näitä osioita ei ole.

### Voiko raporttia muokata lähettämisen jälkeen?

Lukittu raportti (statecode ei-aktiivinen) näytetään vain luku -tilassa. Tallenna- ja muokkaustoiminnot eivät ole käytössä.

### Miten KPI-ehdotukset siirtyvät käyttöön?

Projektipäällikön ehdottamat KPI-arvot (Ehdotettu-sarake) siirtyvät nykyisiksi arvoiksi (Nykyinen-sarake) kun raportti hyväksytään xPM-järjestelmässä.

### Miten vaihdan raportin kielen tulostusta varten?

Valitse haluttu kieli työkalupalkin kielivalitsimesta (EN/FI/SV) ennen kuin klikkaat Tulosta-painiketta. Kieli vaihtuu välittömästi ja näkyy myös tulosteessa.
