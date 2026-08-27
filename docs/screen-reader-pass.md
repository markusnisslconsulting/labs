# Der erste Screenreader-Durchgang

Was zu prüfen ist, in der Reihenfolge, und woran man ein Problem erkennt.

Die Matrix in `packages/ui/src/audit/screen-readers.ts` hat 105 Zellen.
Die sind nicht die Aufgabe. Die Aufgabe ist dieser Zettel: **sechs
Komponenten, eine Paarung, etwa vierzig Minuten.** Danach weiß man mehr
über diese Bibliothek als jeder automatisierte Lauf sagen kann, und die
restlichen 99 Zellen sind eine Fleißarbeit, die man verteilen kann.

## Vorbereitung

Eine Paarung genügt für den ersten Durchgang. Auf dem Mac ist VoiceOver
mit Safari das Naheliegende: **Cmd + F5** schaltet ein, **Ctrl + Option +
Pfeiltasten** wandert, **Ctrl + Option + A** liest von hier ab weiter.

```sh
pnpm nx run ui:storybook
```

Was die automatisierten Schichten schon abdecken, damit du nicht danach
suchst: dass jedes Control einen Namen hat, dass Hint und Fehler als
Beschreibung ankommen, dass die Reihenfolge im Baum stimmt, dass Rollen
und Zustände gesetzt sind. Das steht in `browser/announce.spec.ts` und
läuft in CI.

**Wonach du also hörst, ist etwas anderes:** ob das, was gesagt wird, für
einen Menschen brauchbar ist. Zu viel, zu wenig, in der falschen
Reihenfolge, oder zweimal.

## 1. TextField — `components-textfield--matrix`

Tab durch alle sechs Felder.

- Beim Feld "With error": kommt **Label, dann Fehler**, oder erst der
  Fehler? Ein Reader, der mit dem Fehler anfängt, lässt jemanden raten,
  worauf er sich bezieht.
- Beim Feld "Required": wird "required" **einmal** gesagt? Genau das war
  bis vor kurzem doppelt, und der automatisierte Name-Test fängt nur die
  Verdopplung im Namen — nicht, wenn ein Reader den Zustand zusätzlich
  aus dem Attribut ansagt und es dadurch trotzdem zweimal klingt.
- Beim Feld "With affixes": werden `>=` und `units` mitgelesen? Sie sind
  `aria-hidden`, also sollten sie **nicht** kommen. Wenn doch, ist die
  Einheit für einen Reader verschwunden — und dann ist `aria-hidden` dort
  die falsche Entscheidung.

## 2. Select — `components-select--matrix`

- Wird die Anzahl der Optionen angesagt? "1 von 3" ist nützlich, gar
  nichts ist es nicht.
- Beim Öffnen: liest der Reader die aktuelle Auswahl, bevor du wanderst?
- Das deaktivierte Select: sagt er "dimmed" oder "unavailable" — oder
  nichts?

## 3. Dialog — `components-dialog--open-with-page-behind`

Die wichtigste Zelle der ganzen Matrix, weil die modale Semantik hier
selbst gebaut ist und Base UI sie nicht geliefert hat.

- Beim Öffnen: wird **Titel und Beschreibung** angesagt, oder nur
  "dialog"?
- Wander mit Ctrl+Option+Pfeil **über den Dialog hinaus**. Kommst du an
  den Button dahinter? Du solltest nicht. Wenn doch, ist `inert` nicht
  wirksam — und das ist der Unterschied zwischen "sieht modal aus" und
  "ist modal".
- Escape: sagt der Reader danach, wo der Fokus gelandet ist?

## 4. Toaster — `components-toaster--imperative`

Live-Regionen sind die Stelle, an der Bibliotheken am häufigsten falsch
liegen, und kein statischer Test sieht es.

- Klick den Trigger. Wird der Toast **angesagt, während du woanders
  bist**? Das ist der Zweck.
- Wird er **unterbrechend** angesagt (mitten in einem Satz) oder wartet
  er? Für `success` sollte er warten, für `danger` nicht.
- Kommt er **zweimal**? Ein doppelt angesagter Toast heißt meist, dass
  die Region und der Inhalt beide live sind.

## 5. Tabs — `components-tabs--matrix`

- Pfeiltaste rechts: sagt der Reader den neuen Tab an, **ohne** zu
  behaupten, er sei ausgewählt? Diese Komponente aktiviert manuell, und
  ein Reader, der "selected" sagt, während nur der Fokus gewandert ist,
  führt in die Irre.
- Nach Enter: kommt das Panel, oder muss man es suchen?
- Der deaktivierte Tab: als "dimmed" angesagt oder übersprungen?

## 6. Table — `components-table--wide-columns`

- In einer Zelle: wird der **Spaltenkopf** mitgesagt? Ohne das ist eine
  Tabelle eine Zahlenwüste.
- Wird die Position angesagt ("Reihe 2 von 3")?
- Beim Betreten und Verlassen: sagt er "Tabelle, 3 Reihen, 6 Spalten" und
  am Ende "Tabellenende"?

## Was du aufschreibst

Pro Zelle in `screen-readers.ts`: das Datum und **was du gehört hast** —
nicht, was hätte kommen sollen.

```ts
{ component: "Dialog", why: "…", cells: {
  "voiceover-safari": {
    checked: "2026-08-28",
    notes:
      "Titel und Beschreibung kommen. Wandern über den Dialog hinaus " +
      "erreicht den Button dahinter nicht. Nach Escape sagt VO nur " +
      "'Button', nicht welchen — der Fokus landet richtig, die Ansage " +
      "ist dünn.",
  },
  …
}}
```

Der Test in `packages/ui/test/audit.spec.ts` verlangt beides: ein
ISO-Datum und Notizen. Ein datierter Durchgang ohne Aufschrieb ist von
keinem Durchgang nicht zu unterscheiden.

Und wenn etwas falsch klingt, aber du nicht sicher bist, ob es die
Komponente oder der Reader ist: aufschreiben, dass du unsicher warst. Das
ist eine brauchbare Notiz. "Vermutlich in Ordnung" ist keine.
