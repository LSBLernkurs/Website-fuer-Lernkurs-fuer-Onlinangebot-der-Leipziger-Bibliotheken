Um in VSCode die Abschnitte zu verbinden muss folgender Befehl im powershell Terminal ausgeführt werden:
Get-Content gdd\abschnitte\*.md | Set-Content gdd\README.md

Um Bilder zu verlinken müssen diese für die README.md passend sein, statt für die Abschnitte (beides geht nicht bei meiner ausgewählten Ordnung nicht). Beispiel wie eine Verlinkung aussehen sollte: ![Test]_(bilder/testbild.jpg) (Hinweis: Ohne Leerzeichen zum aktivieren)
