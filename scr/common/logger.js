//Zentraler Logger (keine Phaser-Scene, sondern ein JavaScript-Modul)
//Schreibt bisher alles in die Browser-Konsole, mit Zeitangabe seit Spielstart.
//Benutzung: import { logger } from "../common/logger.js"; logger.log("aktion", { ... });
class SpielLogger {
  //Zeitpunkt, an dem das Modul geladen wurde (= ungefähr Spielstart)
  #startZeit = window.performance.now();
  #offeneSzenen = new Map(); //szenenKey -> Zeitpunkt des Betretens (ms)
  //Zeitpunkt, an dem zuletzt ein Link geöffnet wurde (wird bisher nur gespeichert, nirgends ausgewertet)
  #linkZeit = null;

  //Millisekunden seit Spielstart
  #jetzt() {
    return Math.round(window.performance.now() - this.#startZeit);
  }

  //Allgemeiner Log-Eintrag
  //aktion:     kurzer Name des Ereignisses, z.B. "raum_gewaehlt"
  //extraDaten: beliebige zusätzliche Infos als Objekt
  log(aktion, extraDaten = {}) {
    console.log(`[LOG] ${aktion} bei ${this.#jetzt()}ms`, extraDaten);
  }

  //---------- Scenes ----------
  //Beim Betreten merken der Zeit, damit beim Verlassen die Verweildauer berechnet werden kann
  szeneBetreten(szenenKey) {
    this.#offeneSzenen.set(szenenKey, this.#jetzt());
    this.log("szene_betreten", { szene: szenenKey });
  }

  szeneVerlassen(szenenKey) {
    const start = this.#offeneSzenen.get(szenenKey);
    if (start === undefined) return; //Scene wurde nie als betreten gemeldet => nichts loggen
    this.#offeneSzenen.delete(szenenKey);
    //dauer = Verweildauer in der Scene in Millisekunden
    this.log("szene_verlassen", {
      szene: szenenKey,
      dauer: this.#jetzt() - start,
    });
  }

  //---------- Link ----------
  //textKey: ID des Textes, zu dem der Link gehört
  linkGeoeffnet(textKey, url) {
    this.#linkZeit = this.#jetzt();
    this.log("link_geoeffnet", { textKey, url });
  }
}

//Es gibt nur diese eine Instanz, alle Dateien teilen sich dieselbe (Singleton)
export const logger = new SpielLogger();
