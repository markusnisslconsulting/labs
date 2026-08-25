# 0005 — Token-Deprecation als Daten, durchgesetzt mit einer Ratsche

Status: akzeptiert (2026-08)

## Kontext

Tokens sind eine öffentliche API. Sobald mehr als ein Team konsumiert,
sind die zwei häufigsten Fragen: „Benutzt das noch jemand, kann ich es
löschen?" und „Wir haben das vor Monaten deprecated — kommen immer noch
neue Verwendungen dazu?"

Beide werden üblicherweise mit grep beantwortet, und grep antwortet
falsch. Tokens aliasen einander: ein Primitive ohne direkte Referenz in
irgendeinem Komponenten-Stylesheet lebt sehr wohl, wenn ein semantisches
Token es aliast. Verwendung ist **transitiv**.

Das zweite Problem ist Koordination. Ein hartes Verbot bricht Teams
mitten in ihrer Roadmap; eine reine Warnung wird ignoriert und die Zahl
der Verwendungen steigt weiter.

## Entscheidung

**Deprecation ist ein Feld, kein Kommentar.** `TokenDescriptor.deprecated`
trägt Grund und Ersatz, gespiegelt an DTCG `$deprecated`. Werkzeuge
können es lesen; ein Kommentar im CSS kann das nicht.

**Verwendung wird als Erreichbarkeit berechnet, nicht als Textsuche.**
`scripts/tokens/usage.ts` baut den Alias-Graphen (Kante: „A referenziert
B im eigenen Wert"), nimmt als Wurzeln alles, was aus Komponenten-CSS,
Element-Defaults, Produktcode oder aus einem Theme-/Brand-Block
referenziert wird, und rechnet die Hülle. Was von keiner Wurzel aus
erreichbar ist, ist tot.

**Durchsetzung ist eine Ratsche, kein Verbot.** Eine Baseline-Datei hält
fest, wie viele Verwendungen eines deprecateten Tokens toleriert sind.
Der Check schlägt fehl, wenn die Zahl **steigt** — und ebenso, wenn sie
gesunken ist, ohne dass die Baseline nachgezogen wurde. Bestehende
Verwendungen blockieren niemanden, neue kommen nicht durch, und der
Fortschritt kann nicht zurückrollen.

## Konsequenzen

- Ein Team migriert in seinem Tempo; das System verliert währenddessen
  keinen Boden.
- „Intern unbenutzt" heißt nicht „sicher löschbar": ein konsumierendes
  Produkt kann Referenzen halten, die dieses Repo nicht sieht. Der
  Report sagt das explizit. Der Weg ist deprecaten, warten, dann
  entfernen.
- Der Graph findet nebenbei Tippfehler: ein `var(--uix-text-primry)`
  ist von keiner Deklaration gedeckt und lässt den Check rot werden.
- Kosten: eine Baseline-Datei im Repo, die bei jeder bewussten Änderung
  mitgeschrieben werden muss (`nx run ui:tokens-baseline`).
