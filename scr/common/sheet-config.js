//Zentrale Einstellungen für das Google Sheet
//Adresse des im Web veröffentlichten Google Sheets (Datei > Freigeben > Im Web veröffentlichen)
const BASIS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_Svxiw_JLf9tU93z9xO2Ec0R6y7rzJKrENHUiDDaWGg4G89Xg1qLF0JOUfcf0qCXr-LQD27V0oYnk/pub";

//gid = ID des Tabs im Sheet (steht in der Adresszeile hinter "gid="). null = es gibt keinen Regeln-Tab
const REGELN_GID = 1468720527;

//Baut die Adresse für einen Tab. output=tsv => Tabs als Spaltentrenner, single=true => nur dieser eine Tab
const tsvUrl = (gid) => `${BASIS_URL}?gid=${gid}&single=true&output=tsv`;

export const SHEET_URLS = {
  //gid 0 = der erste Tab im Sheet (Texte)
  texte: tsvUrl(0),
  //Tab mit den Dialogregeln (siehe dialog-system.js)
  regeln: REGELN_GID !== null ? tsvUrl(REGELN_GID) : null,
};
