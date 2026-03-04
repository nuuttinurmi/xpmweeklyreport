# Työvaiheilmoituksen automatisointi

Viikoittainen työvaiheilmoitus generoidaan automaattisesti xPM (Projectum) ja Dynamics 365 -datasta. PM:n käsityö vähenee ~70 % — automaattiset osiot haetaan lennossa Dataversestä, PM täyttää vain kommentit ja tilannekuvan.

## Dokumentaatio

| Dokumentti | Sisältö |
|---|---|
| [Tyovaiheilmoitus_Automaatio.md](Tyovaiheilmoitus_Automaatio.md) | Pääspeksi: kenttämappaukset, datapolut, taulurakenne, UI-suunnitelma, prosessiketju |
| [Raporttipohja_Esimerkki.md](Raporttipohja_Esimerkki.md) | Esimerkkiraportti näytetiedoilla — näyttää miltä lopputulos näyttää |
| [Toteutusvaihtoehdot.md](Toteutusvaihtoehdot.md) | Tulostustapojen vertailu: Paginated Report / Word-template / Canvas App |
| [Projektisuunnitelma.md](Projektisuunnitelma.md) | Vaiheet, tehtävät, aikataulu, riskit, aloitusedellytykset |

## Lyhyesti

**Lähdejärjestelmät:** xPM (`pum_`-taulut) + Dynamics 365 (`ecr_`-taulut), sama Dataverse-ympäristö.

**Uudet taulut:**
- `aud_weeklyreport` — raportin pääentiteetti (PM:n syötteet: action items, tilannekuva, työturvallisuus)
- `aud_weeklyreporttasknote` — tehtäväkohtaiset "Huomioitavaa"-kommentit

**Periaate:** Automaattinen data haetaan lennossa olemassa olevista tauluista — uusiin tauluihin tallennetaan vain PM:n käsin kirjoittamat tiedot.

**Prosessi:**
1. PM luo viikkoraportin (tai ajastettu flow)
2. PM täyttää kommentit initiative-lomakkeen Weekly Reports -välilehdellä
3. PM painaa "Generoi PDF" → Power Automate hakee kaiken datan → PDF SharePointiin

## Aloitusedellytykset

Tarkista ennen kehityksen aloitusta — lista löytyy [Projektisuunnitelma.md](Projektisuunnitelma.md#aloitusedellytykset)-tiedostosta.
