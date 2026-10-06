Um in VSCode die Abschnitte zu verbinden muss folgender Befehl im powershell Terminal ausgeführt werden:
Get-Content gdd\abschnitte\*.md | Set-Content gdd\README.md

Um Bilder zu verlinken müssen diese für die README.md passend sein, statt für die Abschnitte (beides geht nicht bei meiner ausgewählten Ordnung nicht). Beispiel wie eine Verlinkung aussehen sollte: ![Test]_(bilder/testbild.jpg) (Hinweis: Ohne Leerzeichen zum aktivieren)

# 1.Projektübersicht & Mission Statement

## Informationen über das Projekt

Dieses Projekt dient der Entwicklung eines Spiels, welches von Mitarbeitern der Leipziger Bibliotheken ausprobiert werden kann, um über das Onlineangebot PressReader und dessen Nutzung zu lernen. Dabei wird eine Art hybrides System gebaut, wo auf der einen Seite die kodierte Spielwelt liegt, der der man sich als Spieler bewegen und Dinge entdecken kann, und auf der anderen Seite die Lerninhalte stehen, die über Lernspiele und anderer Methoden auf extra Seiten erlernt werden. Die Idee ist, dass man die Lerninhalte ganz leicht über ein Google Sheet austauschen kann und somit ohne jegliche Programmierungskenntnisse der Lernkurs verändert werden kann. Somit könnte man einfach ein neues Lernspiel, z.B. ein Quiz, erstellen, den Link mit einem anderen Link im Sheet austauschen und vom Spiel aus käme man nun zu diesem neuen Lerninhalt. Dadurch kann die Spielwelt wiederverwendet und angepasst werden.

![Süßes Katzenbild als Test](bilder/testbild.jpg)

# 2.Gameplay & Mechaniken

Dieses Spiel ist ausschließlich als Browser-Anwendung gedacht.

# 3.Setting & Story

Es ist die Nutzung von NPCs geplant.

# 4.Level Design

Es wird eine Spielwelt in Form von Tilemaps geben. 2D, Top-Down-Prinzip.

# 5.Visuelles Design

Wird stark von den ausgewählten Assets abhängen.

# 6.Sound-Design

Es muss noch entschieden werden, ob es überhaubt Sound-Design geben soll.

# 7.Technische Umsetzung

## (geplannt) genutzte Werkzeuge

- Visual Studio Code (Quelltext-Editor zum Programmieren)
- Phaser.js (2D-Game-Framework zum Programmieren von Spielen)
- ESLint (zur statischen Code-Analyse)
- Prettier (um Quellcode zu formatieren)
- Node.js (zur einfachen Installation von Phaser.js, ESLint und Prettier)
- Live Server (VSCode-Extension für einen lokalen Entwicklungsserver)
- GitHub (Online-Plattform für Programmierer)
- GitHub Pages (um statische Webseiten direkt aus einem Repository im Internet zu veröffentlichen)

- Tiled Map Editor (2D-Level Editor zum erstellen der grafischen Oberflächen)
- itch.io (Online-Plattform auf der man kostenlose Assets finden und runterladen kann)
- Google Sheets (webbasiertes Tabellenkalkulationsprogramm von Google)
- Genially (Online-Plattform mit der man interaktive Inhalte erstellen kann)
- Blooket (Online-Plattform mit der man Lernspiele erstellen kann)

# 8.Multiplayer/Onlinefuntionalität

Wäre erwünscht und leicht zumindest im Lerninhaltsbereich über die geplanten Werkzeuge möglich. Jedoch liegt die Priorität erstmal auf einem funtionstüchtigen Soloplayer.

# 9.Assets & Ressourcen

Liste aller Assets (von itch.io):
[kommt noch]

# 10.Projektmanagement & Meilensteine

Entwickler: Kiara Schunk (E-mail: kiara.schunk@stud.htwk-leipzig.de )

Dieses Projekt wurde in Auftrag gegeben von dem Zusammenschluss der Stadt Leipzig, über die Stadtbibliothek Leipzig, und ist im Zeitraum eines dreimonatigen Praktikums entwickelt worden.
Betreuerin und Ansprechpartnerin: Silvana Kühne (E-mail: Silvana.Kuehne@leipzig.de )

# 11.Referenzen & Inspirationsquellen

Aufbau des GDD von M.Sc. Nico Laube, HTWK Fakultät für Informatik und Medien, Modul: Virtuelle & erweiterte Realität
