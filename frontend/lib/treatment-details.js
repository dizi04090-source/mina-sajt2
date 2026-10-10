const details = {
  'Masaža celog tela': {
    summary: 'Predah za telo, opuštanje za um.',
    intro: 'Masaža namenjena opuštanju i prijatnom osećaju u telu. Pre početka reci Mini koje regije želiš da budu u fokusu i kakav ti pritisak odgovara.',
    includes: ['Dogovor o pritisku i regijama koje želiš da budu u fokusu', 'Masaža prilagođena tvojoj udobnosti', 'Vreme za mir i opuštanje tokom tretmana'],
    benefits: ['Može doprineti opuštanju', 'Može privremeno ublažiti osećaj napetosti u mišićima', 'Prilika da usporiš i posvetiš vreme sebi'],
    preparation: 'Pomeni povrede, osetljive regije ili zdravstvena stanja pre početka. Pritisak uvek treba da bude prijatan; slobodno zatraži prilagođavanje.',
    source: ['Više o masaži', 'https://www.nccih.nih.gov/health/massage-therapy-what-you-need-to-know'],
  },
  'Limfna drenaža': {
    summary: 'Nežan pristup nezi i osećaju lakoće.',
    intro: 'Limfna drenaža je tehnika usmerena na kretanje limfne tečnosti. Sa Minom proveri da li je ovaj tretman odgovarajući za tebe i koja se metoda koristi u salonu.',
    includes: ['Razgovor o cilju tretmana i tvojoj osetljivosti', 'Dogovor o metodi i regijama koje se tretiraju', 'Pažljiv pristup prilagođen tvojoj udobnosti'],
    benefits: ['Kod odgovarajućih indikacija može pomoći kretanju limfne tečnosti', 'Blag pristup u odnosu na duboku masažu', 'Individualni dogovor o nezi tela'],
    preparation: 'Ako imaš neobjašnjiv otok ili zdravstveno stanje, prvo proveri sa lekarom da li je limfna drenaža prikladna za tebe.',
    source: ['Više o limfnoj drenaži', 'https://my.clevelandclinic.org/health/treatments/21768-lymphatic-drainage-massage'],
  },
  'Čišćenje lica': {
    summary: 'Pažnja tvojoj koži i njenim potrebama.',
    intro: 'Nega usmerena na čišćenje lica. Izbor postupka zavisi od tipa kože i njenog trenutnog stanja, pa pre tretmana razgovaraj sa Minom o svojim potrebama.',
    includes: ['Razgovor o tipu kože i dosadašnjoj nezi', 'Dogovor o postupku čišćenja', 'Smernice za negu nakon tretmana'],
    benefits: ['Čistiji osećaj na koži', 'Nega prilagođena tvom licu', 'Bolje razumevanje potreba tvoje kože'],
    preparation: 'Pomeni alergije, iritacije, aktivne preparate i nedavne tretmane. Proveri sa Minom kako da pripremiš kožu.',
  },
  'Facijalni tretman': {
    summary: 'Tvoj ritual za negovanu kožu.',
    intro: 'Tretman lica koji se bira prema potrebama tvoje kože. Mina će ti pomoći da odrediš cilj nege i odgovarajući pristup.',
    includes: ['Razgovor o potrebama kože', 'Dogovor o koracima i proizvodima', 'Smernice za nastavak nege kod kuće'],
    benefits: ['Vreme posvećeno nezi lica', 'Prijatniji osećaj na koži', 'Individualni pristup tvojoj rutini'],
    preparation: 'Pre dolaska navedi alergije i proizvode koje trenutno koristiš. Tačan sastav tretmana potvrdi sa Minom.',
  },
  'Anti-age tretman': {
    summary: 'Promišljena nega za svež izgled.',
    intro: 'Nega lica usmerena na izgled i potrebe zrelije kože. Pristup i proizvodi biraju se u dogovoru sa Minom.',
    includes: ['Razgovor o cilju i trenutnoj rutini', 'Dogovor o odabranoj nezi lica', 'Preporuke za dalju negu'],
    benefits: ['Usmerena nega kože', 'Pažnja teksturi i izgledu lica', 'Ritual prilagođen tvojim potrebama'],
    preparation: 'Pomeni osetljivost kože, aktivne preparate i nedavne estetske tretmane. Rezultati zavise od kože i odabrane metode.',
  },
  'Tretman tela': {
    summary: 'Nega tela po tvojoj meri.',
    intro: 'Vreme posvećeno nezi tela. Pre rezervacije dogovori sa Minom regije, cilj i tačan sadržaj tretmana.',
    includes: ['Razgovor o cilju nege', 'Dogovor o regijama i postupku', 'Prilagođavanje tvojoj udobnosti'],
    benefits: ['Pažnja koži i nezi tela', 'Vreme za opuštanje', 'Individualni izbor tretmana'],
    preparation: 'Pomeni osetljivost kože i alergije. Mina će ti potvrditi pripremu za odabrani postupak.',
  },
  'Depilacija': {
    summary: 'Glatka koža, pažljiv pristup.',
    intro: 'Uklanjanje neželjenih dlačica sa regija koje dogovoriš sa Minom. Pre rezervacije proveri metodu, obuhvaćene regije i pripremu.',
    includes: ['Dogovor o regijama i metodi', 'Pažnja osetljivosti kože', 'Smernice za negu nakon depilacije'],
    benefits: ['Uklanjanje neželjenih dlačica', 'Glatkiji osećaj na koži', 'Nega prilagođena odabranim regijama'],
    preparation: 'Pomeni iritacije i aktivne preparate. Pre dolaska proveri potrebnu dužinu dlačica i smernice za odabranu metodu.',
  },
  'Wellness paket': {
    summary: 'Više vremena za tvoj trenutak mira.',
    intro: 'Duži ritual nege i opuštanja. Kombinaciju tretmana i redosled dogovori sa Minom pre rezervacije.',
    includes: ['Dogovor o sadržaju paketa', 'Kombinacija nege prema tvojim željama', 'Vreme posvećeno tvom odmoru'],
    benefits: ['Duži predah od svakodnevnog ritma', 'Više nege u jednom dolasku', 'Ritual usklađen sa tvojim potrebama'],
    preparation: 'Proveri sa Minom koji su tretmani uključeni u paket i da li je potrebna posebna priprema.',
  },
};

export function treatmentDetails(treatment) {
  return details[treatment.name] || {
    summary: 'Nega prilagođena tebi.',
    intro: treatment.description || 'Saznaj više o ovom tretmanu u razgovoru sa Minom.',
    includes: ['Dogovor o cilju tretmana', 'Potvrda postupka i pripreme pre dolaska'],
    benefits: ['Individualni pristup nezi', 'Vreme posvećeno tebi'],
    preparation: 'Za tačan sadržaj i pripremu obrati se Mini pre rezervacije.',
  };
}
