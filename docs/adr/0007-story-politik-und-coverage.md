# 0007 — Referenz zeigt, Interaktion handelt; Coverage folgt dem Typ

Status: akzeptiert (2026-08)

## Kontext

Button hatte neun Stories, Banner eine, und keine Regel sagte, welche
Zahl richtig ist. „Mehr Stories" ist keine Norm, sondern eine Stimmung.

Dazu ein konkreter Fehler: Chromatic fotografiert das Bild **nach**
`play()`. Zehn Stories mutierten in `play()` und hielten damit den
Zustand nach der Interaktion als Baseline fest — unter einem Namen, der
den Anfangszustand versprach. `Switch/Off` klickte sein eigenes Label,
also stand der Off-Schalter auf on, sobald jemand hinsah.
`Alert/Dismissible` entließ sich selbst und sah deshalb kaputt aus.

## Entscheidung

**Referenzstories mutieren nicht.** Sie zeigen einen Zustand und prüfen
ihn höchstens. Sie sind die Dokumentation und die Chromatic-Baseline.

**Interaktionen sind eigene Stories** und verzichten auf Snapshots
(`chromatic.disableSnapshot`). Ausnahmen mit Begründung sind erlaubt:
`Focus` und `Dialog` behalten ihre Snapshots, weil der Fokusring und der
offene Dialog genau das Bild sind, das eine Baseline haben soll.

**Coverage wird aus der Typsignatur abgeleitet, nicht verhandelt.**
`scripts/stories/coverage.ts` fordert:

1. Jeder Wert jedes Union-Props wird von irgendeiner Story gerendert,
   und jedes Zustands-Boolean wird irgendwo `true`. Ein Zustand, den
   niemand sehen kann, wird von niemandem geprüft, und Chromatic kann
   ihn nicht als Baseline halten.
2. Mindestens eine Assertion pro Komponente. Eine Story ohne `expect`
   ist ein Bild; hier sollen Stories auch Prüfungen sein.
3. Ist die Komponente bedienbar, führt eine Story sie über die Tastatur.

Ausnahmen stehen in `EXCEPTIONS` mit Grund, damit eine Befreiung eine
Entscheidung im Repository ist und kein Schweigen.

## Konsequenzen

- Beim Einschalten: 32 Verstöße. Darunter **33 von 34 Komponenten ohne
  Tastaturtest**, während die Dokumentation Tastaturbedienung behauptete.
- Werte, die die Komponente selbst als Default setzt, gelten als
  gezeigt; sonst würde die Regel eine Story verlangen, die nichts ändert.
- Die Regel wächst mit dem Typ: ein neues `variant` fordert seine Story
  am Tag seiner Einführung, nicht beim nächsten Audit.
