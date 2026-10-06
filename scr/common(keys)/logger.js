//Zentraler Logger (keine Phaser-Scene, sondern ein Javascript-Modul)

const ZEIT_FELDER = ["zeit", "start", "dauer", "dauerSeitLink"];

//312450 -> "5:12:450" (Minuten:Sekunden:Millisekunden), 2804 -> "0:02:804"
function formatiereZeit(ms) {
  const minuten = Math.floor(ms / 60000);
  const sekunden = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const millisekunden = String(ms % 1000).padStart(3, "0");
  return `${minuten}:${sekunden}:${millisekunden}`;
}

//2026-09-29T06:10:48.325Z -> "2026-09-29, 08:10:48:325" (lokale Zeit)
function formatiereDatum(datum) {
  const z = (zahl, stellen = 2) => String(zahl).padStart(stellen, "0");
  return (
    `${datum.getFullYear()}-${z(datum.getMonth() + 1)}-${z(datum.getDate())}, ` +
    `${z(datum.getHours())}:${z(datum.getMinutes())}:${z(datum.getSeconds())}:${z(datum.getMilliseconds(), 3)}`
  );
}

class SpielLogger {
  #eintraege = [];
  #startZeit = window.performance.now();
  #startDatum = new Date().toISOString();
  #gedrueckteTasten = new Map();
  #offeneSzenen = new Map();
  #linkZeit = null;
  #dateiHandle = null;

  #dateiname() {
    return `spiel-log_${this.#startDatum.replace(/[:.]/g, "-")}.json`;
  }

  //einmalig aufrufen (braucht eine Nutzeraktion)
  async dateiFuerAutosaveWaehlen() {
    if (!window.showSaveFilePicker) return false;
    try {
      this.#dateiHandle = await window.showSaveFilePicker({
        suggestedName: this.#dateiname(),
        types: [
          {
            description: "Spiel-Log (JSON)",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      await this.zwischenstandSpeichern();
      return true;
    } catch (fehler) {
    console.warn("Dateiauswahl abgebrochen oder fehlgeschlagen", fehler);
    this.#dateiHandle = null;
    return false;
    }
  }

  //überschreibt die gewählte Datei mit dem aktuellen Stand
  async zwischenstandSpeichern() {
    if (!this.#dateiHandle) return;
    try {
      const schreiber = await this.#dateiHandle.createWritable();
      await schreiber.write(JSON.stringify(this.#lesbareDaten(), null, 2));
      await schreiber.close();
    } catch (fehler) {
      console.warn("Zwischenstand konnte nicht gespeichert werden", fehler);
    }
  }

  constructor() {
    window.addEventListener("keydown", (e) => this.#tasteRunter(e));
    window.addEventListener("keyup", (e) => this.#tasteHoch(e));

    window.addEventListener("blur", () => {
      this.#beendeAlleTasten("fenster_verlassen");
      this.log("fenster_verlassen");
    });
    window.addEventListener("focus", () => this.log("fenster_zurueck"));
  }

  //Millisekunden seit Spielstart
  #jetzt() {
    return Math.round(window.performance.now() - this.#startZeit);
  }

  log(aktion, extraDaten = {}) {
    const eintrag = { aktion, zeit: this.#jetzt(), ...extraDaten };
    this.#eintraege.push(eintrag);
    console.log(`[LOG] ${aktion} bei ${eintrag.zeit}ms`, extraDaten);
    this.#sichern();
  }

  //---------- Scenes ----------
  szeneBetreten(szenenKey) {
    this.#offeneSzenen.set(szenenKey, this.#jetzt());
    this.log("szene_betreten", { szene: szenenKey });
  }

  szeneVerlassen(szenenKey, grund = "wechsel") {
    const start = this.#offeneSzenen.get(szenenKey);
    if (start === undefined) return;
    this.#offeneSzenen.delete(szenenKey);
    this.log("szene_verlassen", {
      szene: szenenKey,
      dauer: this.#jetzt() - start,
      grund,
    });
  }

  //---------- Tasten ----------
  #tasteRunter(e) {
    if (e.repeat) return; //gehaltene Taste sendet ständig keydown, nur das erste zählt
    this.#gedrueckteTasten.set(e.code, this.#jetzt());
  }

  #tasteHoch(e) {
    this.#beendeTaste(e.code);
  }

  #beendeTaste(taste, grund) {
    const start = this.#gedrueckteTasten.get(taste);
    if (start === undefined) return;
    this.#gedrueckteTasten.delete(taste);
    const extra = { taste, start, dauer: this.#jetzt() - start };
    if (grund) extra.grund = grund;
    this.log("taste", extra);
  }

  #beendeAlleTasten(grund) {
    for (const taste of [...this.#gedrueckteTasten.keys()]) {
      this.#beendeTaste(taste, grund);
    }
  }

  //---------- Link ----------
  linkGeoeffnet(textKey, url) {
    this.#linkZeit = this.#jetzt();
    this.log("link_geoeffnet", { textKey, url });
  }

  //Wird vom Player aufgerufen, sobald er sich bewegt
  spielerBewegt() {
    if (this.#linkZeit === null) return;
    this.log("bewegung_nach_link", {
      dauerSeitLink: this.#jetzt() - this.#linkZeit,
    });
    this.#linkZeit = null;
  }

  //---------- Speichern ----------
  //Sicherung im Browser, falls der Tab vorzeitig geschlossen wird
  #sichern() {
    try {
      window.localStorage.setItem("spielLog", JSON.stringify(this.#daten()));
    } catch {
      //localStorage nicht verfügbar -> ignorieren
    }
  }

  #daten() {
    return { spielStart: this.#startDatum, eintraege: this.#eintraege };
  }

  //Kopie der Daten mit lesbaren Zeiten (nur für die Datei, intern bleiben es Zahlen)
  #lesbareDaten() {
    const eintraege = this.#eintraege.map((eintrag) => {
      const kopie = { ...eintrag };
      for (const feld of ZEIT_FELDER) {
        if (typeof kopie[feld] === "number") {
          kopie[feld] = formatiereZeit(kopie[feld]);
        }
      }
      return kopie;
    });
    return {
      spielStart: formatiereDatum(new Date(this.#startDatum)),
      eintraege,
    };
  }

  async speichern() {
    this.#beendeAlleTasten("spielende");
    for (const key of [...this.#offeneSzenen.keys()]) {
      this.szeneVerlassen(key, "spielende");
    }

    if (this.#dateiHandle) {
      await this.zwischenstandSpeichern();
      return;
    }

    //Fallback: normaler Download
    const blob = new window.Blob(
      [JSON.stringify(this.#lesbareDaten(), null, 2)],
      { type: "application/json" },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.#dateiname();
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const logger = new SpielLogger();
