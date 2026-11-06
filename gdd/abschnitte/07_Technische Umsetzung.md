# 7. Technische Umsetzung

### genutzte Werkzeuge

- Visual Studio Code (Quelltext-Editor zum Programmieren)
- Git Bash (Um eine Git Verbindung mit GitHub zu haben, sowie zur Datensicherung/Back-ups)
- Phaser.js (2D-Game-Framework zum Programmieren von Spielen, in Visual Studio Code sozusagen eine Erweiterung der Programmiersprache JavaScript)
- ESLint (zur statischen Code-Analyse)
- Prettier (um Quellcode zu formatieren)
- Node.js (zur einfachen Installation von Phaser.js, ESLint und Prettier)
- Live Server by Ritwick Dey (VSCode-Extension für einen lokalen Entwicklungsserver, dadurch bekommt man einen "Go Live"-Knopf in Visual Studio Code)
- GitHub (Online-Plattform für Programmierer, hier wurde das Projekt hochgestellt)
- GitHub Pages (um statische Webseiten direkt aus einem Repository im Internet zu veröffentlichen)

- Tiled Map Editor (2D-Level Editor zum Erstellen der grafischen Oberflächen)
- itch.io (Online-Plattform auf der man kostenlose Assets finden und herunterladen kann)
- Google Sheets (webbasiertes Tabellenkalkulationsprogramm von Google)
- Genially (Online-Plattform mit der man interaktive Inhalte und Lernspiele erstellen kann)
- Blooket (Online-Plattform mit der man Fragensätze für interne Lernspiele erstellen kann)

### Code-Praktiken

Um das Skript für ESLint auszuführen, muss folgendes ins Terminal eintippt und ausgeführt werden:<br/>
`npm run lint`<br/>

Dadurch wird der gesamte Code auf Fehler und unsaubere Logik getestet.

Um das Skript für Prettier auszuführen, muss folgendes ins Terminal eintippt und ausgeführt werden:<br/>
`npm run prettier`<br/>

Dadurch wird der gesamte Code auf eine einheitliche Formatierung gebracht.

### (zusätzliche) Notizen zu genutzten Werkzeigen

Diese Notizen sind entstanden, als ich recherchiert habe, was ich an Werkzeugen für dieses Projekt verwenden kann und/oder während ich jene verwendet habe.

Phaser.js:

- open source und in vielen GitHub Projekten verwendet
- nutzt JavaScript
- MIT-Lizenz (Code darf ausgeführt, gelesen, kopiert und modifiziert werden und das Ergebnis muss nicht dieselbe Lizenz haben)
- sehr viel wird unterstützt (an Dateiformaten, an Spielplattformen, etc.)
- hohe Nutzerfreundlichkeit, was Weiterentwicklung für nicht-Informatiker vereinfachen könnte
- v.a. gut für Browser-Anwendungen
- große Nutzerzahlen und damit auch viel Tutorials, Hilfeforen, etc.
- Start bei null, alles muss von Grund auf programmiert werden
- Multiplayer müsste man selber bauen (aufwendig)

GitHub Pages:

- static-site Hosting
- absolut kostenlose Möglichkeit um eine Webseite zu hosten
- auch für GitHub Free Nutzer
- HTML-, CSS- und JavaScript-Dateien
- ich will eh ein GitHub Repository für das Projekt erstellen
- GitHub Main und GitHub Pages muss derselbe Nutzer sein, da GitHub einem jeweils eine Seite pro Nutzer und pro Repository erlaubt
- damit Kompatibel wäre Phaser.js

Tiled Map Editor:

- für die Karten/Maps
- um Welt aus Assets zusammenzubauen
- für einige der anderen Optionen nötig
- habe bereits beim Arbeiten mit Workadventure Erfahrungen gemacht
- kostenlos

itch.io:

- Website zum Hochladen und verbreiten von Videospielen und verwandten Inhalten
- sehr gute Plattform für kostenlose Game Assets
- ich habe bereits eigene Erfahrung mit der Nutzung in diesem Kontext
- da ich selbst (noch) keine Asset-Erstellungserfahrungen habe, würde ich zu der Nutzung von Assets tendieren
- diese werden natürlich von mir ordentlich aufgeschrieben (Credits)

Genially:

- Free-Tarif mit Grundfunktionen
- nicht nur Spiele, sondern auch Präsentationen, Infografiken und mehr erstellbar
- gerade die „Interaktives Bild“ Option könnte sehr gut für das Projekt sein
- in der Gratisversion können die erstellten Inhalte nicht privat oder mit einem Passwort gespeichert werden, sondern es ist immer öffentlich
- viele templates/Vorlagen, auch in der gratis Version
- teilen des erstellten Inhaltes geht, herunterladen nicht
- durch die Erstellungsform/-art sind die Spiele hier fest bzw. immer gleich
- kein Konto als Mitspieler nötig
- bis zu 400 Personen gleichzeitig
- super viele Vorlagen und Optionen
- der Großteil setzt auf Interaktivität
- tatsächlich sind auch ca. 2/3 der Vorlagen kostenlos
- Unter „Spiele und Challanges“ sind v.a. Mehrspieler-Vorlagen, die aber nur über einen Bildschirm laufen
- Unter „Komponenten“ beim Erstellen einer Präsentation sind die ganzen coolen Darstellungsoptionen (z.B. Vergleichs-Tool wo man zwei Bilder hat und mit dem Aufklappen des einen verschwindet das andere)

Blooket:

- nimmt eingegebene Quizfragen und verwandelt sie zu Multyplayer-Minispiele
- bis zu 60 Teilnehmer bei kostenlosem Live-Spiel
- unbegrenztes Erstellen von Fragen-Sets
- kein Account für Live-Spiel Mitspieler nötig
- Fokus kann auf Punkte sammeln oder in Zeitlimit bleiben gesetzt werden
- es gibt auch solo Spiel-Modi
- macht echt Spaß
- wirklich viele Modi
- man erstellt einen Fragensatz und kann den dann für alle Modi oder nur bestimmte, vom Ersteller zuvor festgelegte, Modi nehmen
- da „nur“ Antwort aus vier wählen oder eine Textantwort eintippen geht, eignet sich Blooket v.a. für Antwort zu Bild oder Vokabeltraining. Halt eher für Zuordnungsfragen (mit Bildern)
- man muss einen Account haben, um nicht-gehostete Kartensets zu spielen (aka für den Solo-Modus) …mist
- umso mehr Fragen in einem Set, desto besser. Viele Modi sind so gebaut, dass man schnell durch viele Fragen geht und dadurch bei kleiner Anzahl schnell vieles wiederholt
