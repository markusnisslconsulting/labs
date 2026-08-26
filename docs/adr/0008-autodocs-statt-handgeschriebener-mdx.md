# 0008 — Autodocs mit reichem TSDoc, keine MDX-Seite pro Komponente

Status: akzeptiert (2026-08)

## Kontext

Die Frage war, ob jede Komponente eine handgeschriebene MDX-Seite
bekommt statt der generierten Autodocs, damit mehr Beschreibung
möglich ist.

Der Einwand dahinter ist berechtigt: eine Autodocs-Seite besteht aus
Props-Tabelle und Stories, und damit erklärt sie, _was_ eine Komponente
kann, aber nicht, wann man sie nimmt und wann nicht.

Der erste Versuch war eine MDX-Datei pro Komponente. Er wurde
aufgegeben, und zwar nicht aus Bequemlichkeit. Eine MDX-Seite ist eine
zweite Quelle neben dem Code: sie kennt die Props nicht, also schreibt
jemand sie ab, und abgeschriebene Props veralten. Genau das ist hier
schon zweimal passiert — drei Theming-Tabellen nannten noch
`--uix-radius-m`, nachdem die Form-Rollen eingezogen waren, und niemand
hat es gesehen, bis ein Test danach gesucht hat.

## Entscheidung

**Autodocs bleibt, und das TSDoc der Komponente trägt den Inhalt.**
Alles, was eine MDX-Seite sagen würde, steht im Kommentar über der
Funktion und wird von docgen in die generierte Seite gehoben:

- Ein Satz **Use it for / Reach for something else when**, damit die
  Auswahl zwischen zwei ähnlichen Komponenten auf der Seite steht und
  nicht in einem Vergleichsdokument.
- Ein Abschnitt **Accessibility**, der sagt, was die Komponente selbst
  garantiert und was der Aufrufer schuldet.
- Ein Abschnitt **Theming** mit der Tabelle der Override-Slots.
- Wo es nötig ist, **Performance** und eine Notiz zu abgelehnten
  Alternativen.

**Die Slot-Tabelle wird gegen die Registry geprüft.** Der Test in
`packages/ui/test/tokens.spec.ts` fordert beide Richtungen: jeder
Component-Token erscheint in einer Tabelle, und jeder dort gedruckte
Default ist der Wert aus der Registry. Damit ist die Tabelle
handgeschrieben, aber nicht mehr abschreibbar falsch.

**Freie Prosa bekommt eigene Seiten, keine Komponentenseiten.** Die
Guides (Theming, Accessibility, Contributing, Deprecation) und die
Foundations sind MDX, weil sie keine Props haben, die veralten könnten.

## Konsequenzen

Der Preis ist, dass ein langer Erklärtext in einem Kommentar steht und
Markdown im TSDoc gepflegt werden muss — inklusive der Falle, die
Components/Button tagelang unbrauchbar gemacht hat: ein `<a href />`
ohne Backticks wird von Markdown zu einem echten Anker, und Storybooks
Link-Renderer ruft `href.startsWith` auf. Deshalb lädt `ui:browser-test`
jede der vierzig Docs-Seiten und verlangt, dass sie rendert.

Der Gewinn ist, dass es keine zweite Quelle gibt. Wer die Props ändert,
ändert die Dokumentation im selben Diff, und wer sie nicht ändert, kann
sie nicht vergessen.

## Verworfen

- **MDX pro Komponente.** Zweite Quelle, veraltet, siehe oben.
- **Props-Tabelle von Hand.** Dasselbe Problem, nur kleiner.
- **Nur Autodocs ohne TSDoc-Prosa.** Das war der Ausgangszustand, und
  die Seiten sagten nichts darüber, wann man die Komponente nimmt.
