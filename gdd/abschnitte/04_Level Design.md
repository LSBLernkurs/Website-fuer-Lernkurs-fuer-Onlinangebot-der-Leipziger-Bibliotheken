# 4. Level Design

### Allgemeiner Aufbau

Aktuell strukturierte Reihenfolge aller Räume bzw. Areale. Dies spiegelt sich auch in der Karte im Menü wider, wo alle Räume auf einer Linie dargestellt werden. Jedoch ist ein Raumwechsel über das Menü möglich.

### Anfangs-Scene (Einführung)

Bevor es richtig losgeht, gibt es einen Startbildschirm. Auf diesem wird über das Drücken von "I" der Einführungstext mit ein paar Erklärungen gezeigt. Danach bekommt man eine Raumauswahl mit jeweils Nummer, Name und ungefähre Dauer des Raumes. An sich wäre erwünscht, würde der Spieler dann mit Raum eins anfangen, aber wenn man bereits Räume gespielt hat oder sich nur zu einem bestimmten Thema informieren will, dann führt diese Auswahlmöglichkeit zu einem schnelleren Weg, um dorthin zu kommen, wo man hin will.

### Erster Raum (sozusagen erstes Level)

Der Raum bzw. die Karte der Spielwelt soll an eine Bibliothek erinnern. Dementsprechend wird hier ein Asset mit Büchern und Bücherregalen genutzt.
Der Raum hat eine einfache rechteckige Grundform und ist durch Zwischenwände und Objekte in kleinere Bereiche aufgeteilt (z.B. die Arbeitsecke wo sich der Computer befindet).
Für den Lerninhalt geht es erstmal auf das wichtigste Thema: Einloggen in PressReader. Hierfür gibt es externe Lerninhalte, erstellt in Genially.<br/>
Für den Wechsel von der Spieloberfläche zu den Lerninhalten werden NPCs genutzt (hier alterHerrRaum1 und computer). Der Spieler schaut sich in dem Raum um, kann mit dem älteren Herrn reden, der meint, er bräuchte Hilfe beim Einloggen in PressReader und dass der Spieler sich dafür einmal mit dem Thema beschäftigen soll. Daraufhin kann der Spieler mit einem Objekt (einem Computer) interagieren, wobei jener zur Genially Seite und dem Lerninhalt führt. Der Spieler erledigt dies. Daraufhin kann der Spieler wieder mit dem NPC reden und wird zum Lernspiel weitergeleitet.<br/>
Sobald das Lernspiel erfüllt wurde, kann der Spieler in einen neuen Raum gehen. Hierfür erhält der Spieler einen Schlüssel.
Außerdem gibt es in diesem Raum vier weitere Interaktionsstellen (bei einem Buchregal, beim Sofa, das Bild an der Wand neben der Tür und das Buch auf dem Tresen).

### Zweiter Raum

Ein Pausenraum, der v.a. eine Küche ist. Eine Dame ist da, die sich über das Tassensymbol in PressReader wundert. Der Spieler bekommt die Möglichkeit etwas Tee zu trinken, "in sich zu gehen", wo er zum Lerninhalt geleitet wird, und kann darauf der Dame (im Lernspiel) erklären, was es mit PressReader HotSpots auf sich hat. Danach gibt die Dame den Hinweis, dass der Schlüssel zum nächsten Raum bei einem Pilzkorb, der sich ebenfalls im Raum befindet, ist. Der Spieler kann dadurch diesen erst finden und nun zum nächsten Raum weitergehen.
Neben den wichtigen Interaktionsstellen gibt es auch eine beim Ofen und bei dem Stück Kuchen.

### Dritter Raum

Ein simpler Gang mit Pflanzen und Regalen an den Seiten. Zuerst war dieser Raum nur da um über die Existenz des Blooket Fragensatzes zu informieren, da sich im Laufe des Projektes dagegen entschieden wurde, diesen direkt einzubauen. Man kann den Fragensatz nur mit einem Blooket-Konto spielen, wenn man im Solo-Modus (also alleine) diesen durchgehen will. Außerdem können die Blooket Spiele sehr lange gehen. Darum wird auf diesen nur hingewiesen und der Spieler kann dies selbst im Nachhinein anschauen.<br/>
Jedoch wurde sich zur Evaluation von einem Tester ein Npc gewünscht, der über das Suchen in PressReader informiert und v.a. erklärt, dass man nicht mit abgekürzten Namen von Zeitungen/Zeitschriften suchen kann. Dies wurde sich gewünscht, da die Mitarbeiter der Bibliotheken häufig hierzu Fragen bekommen ("Warum finde ich die LVZ nicht?"). Darum habe ich noch eine Person (mannMitHutRaum3) in diesem Raum hinzugefügt, die einen Lerninhalt hat und dem Spieler direkt den Schlüssel gibt, wenn dieser ausgewählt (und hoffentlich durchgelesen) wurde.
Zusätzlich lassen sich hier drei weitere Interaktionsstellen finden (die Karte, der leere Blumentopf und das aufgeschlagene Buch).

### Vierter Raum

Hier befindet man sich draußen. Der Spieler kommt raus aus dem Bibliotheksgebäude und sieht einen Springbrunnen, einen Fluss, eine kleine Farm, Wald und Hügel und mehr. Dies ist bisher der größte Raum und bietet neben insgesamt fünf Lerninhalten auch einige andere Interaktionsstellen an (gesamt 8 zusätzliche Stellen, die nicht für das Vorankommen Pflicht sind). Hier soll der Nutzer die Möglichkeit haben mehr zu entdecken. Außerdem ist der Fluss animiert und es gibt animierte Insekten (Animation in Tiled erstellt).<br/>
Um weiterzukommen gibt es nur den Weg an einem Dämon vorbei (der andere Weg ist fest versperrt). Um dessen Herausforderung (das Lernspiel) zu erhalten, muss man zuvor mit den vier Personen, die im Raum verteilt sind, reden. Der Holzfäller (mannInGruenRaum4) erklärt einem Kopieren in der PressReader App, der Fischer (mannInOrangeRaum4) Kopieren im Browser, die Frau, welche gerade Wäsche aufhängt (alteFrauRaum4), erklärt das Drucken und schließlich gibt es noch einen dubiosen Mann (mannMitRobeRaum4), der einem das Drucken ohne Wasserzeichen näher bringt. Nachdem man alle vier besucht hat, fordert der Dämon einen heraus und nach Beendigung der Herausforderung lässt dieser den Spieler durch zu einem magischen Kreis (bzw. werden die unsichtbaren Barrieren deaktiviert). Wenn man auf diesen Tritt, dann verschwindet die Scene und man bekommt einen End-Bildschirm.

### Ende-Scene

Nach Raum vier erscheint noch ein Bildschirm, auf dem das Spiel dem Spieler für das Beenden gratuliert und sich für das Spielen des Spiels bedankt. Es regnet Konfetti im Hintergrund.
Ansonsten kann man hier nichts weiter machen, außer das Spiel zu beenden.

### Weitere Ideen

Man könnte mit Schlüsselwörtern zwischen der Spielwelt und den externen Lerninhalten arbeiten. Daher, dass es im Spiel bisher so ist, dass man sofort den Erfolgstext erhält, wenn man der Weiterleitung zu einem externen Inhalt zustimmt, ist es theoretisch auch möglich, den jeweiligen Lerninhalt gar nicht durchzuarbeiten. Stattdessen kann man einfach direkt weitermachen in der Spielwelt. Um dies zu verhindern, könnte man Schlüsselwörter einbauen, die man am Ende des Lerninhaltes (oder aber nur am Ende des Tests/Quiz des jeweiligen Raumes) im extra Tab erhält und dieser muss dann in der Spielwelt eingetippt werden (Spieler sagt sozusagen das Wort zu dem NPC oder es muss auf eine Tafel geschrieben werden oder so ähnlich).

Auch könnte man eine Stelle haben, wo man sich für eine von zwei Türen entscheiden kann. Dann muss man den einen Raum durcharbeiten, bekommt dann die Möglichkeit zum anderen Raum zu gehen und schließlich hat man beide Schlüsselteile oder -wörter, um in den darauffolgenden Raum zu gelangen.

Man könnte natürlich anhand der überlegten Lerninhalte (Siehe 11. Referenzen & Inspirationsquellen) weitere Räume erstellen.

Gerade der Npc mannMitHutRaum3 (aktuell auch bekannt als Steven) würde eigentlich in einen ausgebauten Raum für den Themenbereich "Suchen und Filter" passen. Hier hatte ich bereits die Idee eines Raumes nach Raum 4, wo sich der Spieler an einer Klippe oder einer Waldlichtung befindet und eine Art Campingplatz vor sich findet. Hier befindet sich Personen die alle ähnliche Kleidung tragen (da es von dem Outfit, was mannMitHutRaum3 trägt, noch andere Npcs im Asset gibt) und der Spieler findet heraus, dass es sich hierbei um Pfadfinder oder eine große Familie handelt. Da würde der Spieler von dem Chef/Boss der Gruppe aufgehalten werden und man kann nur passieren, wenn man zeigt, dass man schnell lernen und reagieren kann. Ein Lerninhalt wie ein Genially-Test mit zeitlicher Begrenzung/einem Timer würde sich hier gut anbieten.

Zusätzlich kam durch einen Tester die Idee auf, noch einen Raum zu haben, in dem man zu jedem Thema eine Verlinkung zu einem zusammengefassten Text des Themas mit den wichtigsten Informationen findet. Zum Beispiel könnte dieser Raum nach Beendigung des Spiels freigeschaltet werden und mit diesem kann man schnell Themen wiederholen ohne das ganze Spiel erneut durchgehen zu müssen. Auch könnte man in diesem Raum nochmal die Tests/Quizze der jeweiligen Räume verlinken, um schneller diese erreichen zu können. Außer Figuren/Objekten mit diesen Verlinkungen bräuchte es nichts im Raum.<br/>
Jedoch würde sich dieser für nette Extras wie eine Statistik (z.B. benötigte Spielzeit) für den Spieler eignen (bzw. wenn sowas wie Statistiken, dann hier). Gleichzeitig geht es in dem Spiel allgemein nicht um Schnelligkeit oder gute Zahlen, sondern darum die Lerninhalte zu verinnerlichen, weshalb Statistiken auch einen negativen Effekt mit sich bringen könnten. Es ist eine Idee, die erst abgewägt werden müsste.
