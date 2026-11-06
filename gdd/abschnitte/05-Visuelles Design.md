# 5. Visuelles Design

Es gibt eine Spielwelt in Form von Tilemaps. 2D, Top-Down-Prinzip, Pixelart.
Die externen Lerninhalte sind mithilfe von Genially erstellt worden, wobei hier zumeist auf dessen kostenlosen Vorlagen gegangen wurde. Diese wurden entweder wegen ihres angenehmen Designs oder passend zum Npc, der hierzu verlinkt, ausgewählt.

### Menü

Mit der Taste "M" kann man sich das Menü anzeigen lassen. Dieses stoppt die Spielscene. Man hier eine Übersicht über die Steuerung sehen und außerdem eine Karte (die Idee vom Kunden wurde hier umgesetzt). Bei dieser Karte stehen auch Nummern unter den jeweiligen Punkten und wenn man die Zahl-Taste (also 1, 2, 3 oder 4) drückt, dann kann man zu dem ausgewählten Raum (durch eine weitere Bestätigung) wechseln. Wenn man sich in dem ausgewählten Raum bereits befindet, dann gibt es hierzu einen kurzen Hinweis an den Spieler.
Durch das Drücken von "M" oder ESC kommt man wieder aus dem Menü raus.

### Dialog/Texte

Dialoge werden geöffnet, wenn man in dem auslösbaren Bereich steht (der Spieler bekommt einen Hinweis, dass er an solch einer Stelle ist via eines Texthinweises) und man "I" (für Interaktion) drückt. Innerhalb des Textfeldes kann mit "I", ENTER und SPACE den Text vorantreiben. Auch sind diese Tasten zum Bestätigen von Spielerwahlen da. Welche Option bestätigt werden soll, kann mit Pfeiltaste nach oben und nach unten ausgewählt werden.

Das Textfeld hat den Aufbau von dem Namen des angesprochenen Objektes oder die Bezeichnung der Person oben links, in fetter und kursiver Schrift. Darunter erscheint der "gesprochene" Text. Bei einer Auswahl für den Spieler steht nur "Ja" oben und "Nein" unten. Auf welcher Option sich der Spieler gerade befindet, wird durch einen helleren Balken auf der Option angezeigt.

### Schlüssel-Anzahl Anzeige

Eine UI Anzeige in allen Räumen, wo man eine Zahl und daneben einen kleinen Schlüssel oben links im Spielbild hat. Darüber kann der Spieler schnell sehen, ob er gerade einen Schlüssel besitzt oder nicht. Da es aktuell immer nur einen Schlüssel pro Raum gibt (Ausnahme Raum 4, wo der Spieler keinen Schlüssel, sondern die Gunst des Dämons braucht) und dieser beim Weitergehen zum nächsten Raum verbraucht wird, wird die Zahl nicht größer als 1. Außerdem wird immer bei dem Betreten eines Raumes die Anzahl auf 0 zurückgesetzt (damit es keine Probleme beim Raumwechsel gibt).

### Weitere Ideen

Auch wenn die Schlüssel-Anzahl aktuell nicht höher als 1 geht, ist es möglich, mehr Schlüssel in einem Raum zu vergeben. Daher könnte man auch z.B. einen großen Raum mit mehreren Unterräumen (innerhalb einer scene) erstellen, wo man auch mehrere Schlüssel zum Vorankommen sammeln muss.
