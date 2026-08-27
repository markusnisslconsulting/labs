# Fahrplan zur Enterprise-Reife

Zwölf Stufen, jede mit dem Stand von heute. Ein Fahrplan, den niemand
vorhersagen kann, wird geforkt — also steht hier, was steht, was nicht
steht, und woran man das jeweils messen kann.

Stand: 2026-08-27. Die Reihenfolge ist Wirkung, nicht Aufwand.

| #   | Stufe                                              | Stand             |
| --- | -------------------------------------------------- | ----------------- |
| 01  | Der Komponenten-API-Vertrag                        | steht             |
| 02  | Lokalisierung                                      | steht             |
| 03  | Das Inventar, das eine Enterprise-App braucht      | offen, das Größte |
| 04  | Formulare als System                               | halb              |
| 05  | Zustände und Skalierung erstklassig                | steht             |
| 06  | Barrierefreiheit jenseits der automatisierten 40 % | halb              |
| 07  | Distribution und der Versionsvertrag               | halb              |
| 08  | Design und Code als eine Quelle                    | offen             |
| 09  | Performance als Vertrag                            | steht             |
| 10  | Governance und der menschliche Prozess             | halb              |
| 11  | Observability aus echten Produkten                 | offen             |
| 12  | Von einem Agenten lesbar                           | halb              |

## 03 — Das Inventar (offen)

Die größte offene Stufe, und die einzige, bei der reine Menge das Problem
ist. Fünfunddreißig Komponenten reichen für eine Website und nicht für
eine Anwendung. Was fehlt, grob in der Reihenfolge, in der es ein Team
blockiert:

**DataTable** — Sortieren, Spaltenbreiten, Auswahl, Virtualisierung,
Sticky Header. `Table` ist heute Markup mit Stil, keine Datentabelle.
`browser/runtime.spec.ts` misst schon, dass Layout mit den Zeilen und
nicht mit ihrem Quadrat wächst; das ist die Grundlinie, gegen die eine
DataTable antritt.

**DatePicker** — Kalender, Bereich, Lokalisierung, Tastatur. Die teuerste
einzelne Komponente in jedem Design-System.

**Ein echter Combobox** — heute ein `<input list>` über einer `datalist`,
also der Picker des Betriebssystems. Das ist ehrlich und deckt asynchrone
Optionen, Mehrfachauswahl und eigenes Rendering nicht ab.

**Drawer, Stepper, Command Palette, Tree, Toolbar, FileUpload, TagInput,
InlineEdit, EmptyState, AvatarGroup, SplitButton.**

**Charts: eine Entscheidung, keine Komponenten.** Eigene Diagramme sind
ein zweites Design-System. Die Entscheidung ist, welche Bibliothek und
welche Token sie liest.

## 04 — Formulare als System (halb)

`Field` steht: eine Stelle für Label, Hint, Error, Required und die
Verdrahtung, und alle neun Feld-Komponenten benutzen sie. Vorher trugen
neun Felder alle ein `label`, zwei ein `hint`, **eins** ein `error` und
keins `required` — ein verpflichtendes Select mit Validierungsfehler war
nicht ausdrückbar.

Offen: die Ebene über dem Feld. Eine `Form`, die Validierungszeitpunkte
kennt (bei Änderung, bei Verlassen, bei Absenden), eine Fehlerübersicht
oben mit Sprungmarken in die Felder, Fieldset-Gruppierung mit Legende,
und ein Absende-Zustand, der die Formularsteuerung sperrt ohne den
Fokus zu verlieren.

## 06 — Barrierefreiheit (halb)

Steht: der Tastaturvertrag als Daten mit einem Test pro Zeile; alle 55
WCAG-2.2-Kriterien der Stufen A und AA mit dem Gate, das jedes prüft (25
haben eins, 11 sind manuell, 9 gehören dem Produkt, 10 greifen hier
nicht); und zwei automatisierte Screenreader-Schichten — Name,
Beschreibung, Rolle und Zustand pro Knoten, sowie der Baum in
Lesereihenfolge.

Offen: echte Hilfsmittel. 105 Zellen in `src/audit/screen-readers.ts`,
alle "not yet". NVDA und VoiceOver lassen sich mit Guidepup fahren, aber
das braucht einen Windows- oder macOS-Runner; dieses CI läuft auf Linux.
Die Zeilen sind für das, was nur echte AT zeigt: Wortfülle, Satzzeichen,
was ein Reader beim Betreten einer Region sagt.

Ebenfalls offen: die 11 manuellen Kriterien einmal durchgehen und datieren.

## 07 — Distribution (halb)

Steht: die Paketform ist geprüft (publint, attw), jeder CSS-Import im
Build löst auf, ein Consumer-Bundle beweist, dass eine Komponente eine
Komponente kostet, und das Deprecation-Fenster hat Daten samt Gate, das
fällt, wenn eine Frist verstreicht.

Offen und ohne Zugangsdaten nicht machbar: in eine private Registry
veröffentlichen, Canary-Builds aus `main`, und der Versions-Spread über
die Consumer — die echte Version eines Design-Systems ist die älteste, die
noch in Produktion läuft.

Offen und machbar: Semver pro Komponente statt pro Repository. Eine
Breaking Change an `Select` ist ein Major für jeden, der `Select`
importiert, und das Changelog muss die Komponente nennen.

## 08 — Design und Code als eine Quelle (offen)

Die DTCG-Dateien machen den Token-Graph portabel; zurück zu Figma führt
nichts. Figma-Variablen aus dem DTCG-Export generieren, **eine
Richtung** — Code ist die Quelle, Design konsumiert. Zwei-Wege-Sync ist
die Stelle, an der das schiefgeht.

Dazu Code Connect, damit eine Figma-Komponente auf die echten Props zeigt,
und ein Inventar-Diff: was liegt in der Figma-Bibliothek, was im Code, was
nur auf einer Seite. Veröffentlicht, damit die Lücke eine Zahl ist statt
ein Gefühl.

Braucht Figma-Zugang, deshalb offen.

## 10 — Governance (halb)

Steht: `CODEOWNERS` pro Ebene, ein RFC-Formular als Eingangstür, die
Review-Latte in `CONTRIBUTING.md`, Antwortzeiten als Zusage, und dieser
Fahrplan.

Offen und nicht durch Code lösbar: Office Hours und Gespräche mit den
nutzenden Teams. Die Adoptionszahl sagt, dass ein Team am System
vorbeigebaut hat; nur ein Gespräch sagt, warum.

Der Engpass steht in `CONTRIBUTING.md` und gehört auch hierher: ein
Maintainer. Länger als eine Person es tragen kann, wächst das System
nicht.

## 11 — Observability (offen)

Adoption wird heute gemessen, indem dieses Repository seinen eigenen
Quellcode liest. Das trägt für einen Consumer und nicht für eine Firma.

Ein statischer Scanner über die nutzenden Repositories: Komponenten- und
Prop-Nutzung, Token-Nutzung, und auf welcher Version jedes Repo steht.
Optional Runtime-Telemetrie hinter einem Flag, weil "welche Props werden
in Produktion benutzt" eine andere Frage ist als "welche werden
importiert".

Braucht nutzende Repositories, deshalb offen.

## 12 — Von einem Agenten lesbar (halb)

Steht: `packages/ui/inventory.json`, generiert aus der Quelle — 35
Komponenten, 202 eigene Props mit Typ und Doku, die Compound-Parts, die
Override-Slots, der Status, und die Sätze, wann man zu etwas anderem
greift. Ein Gate fällt, wenn die Datei abgedriftet ist. Dazu `AGENTS.md`:
die Regeln als Anweisungen, jede mit dem Gate, das sie erzwingt, und ein
Test, dass diese Zitate auflösen.

Offen: ein MCP-Server über Inventar und Registry. Die Daten liegen jetzt in
einer Form, die einer lesen kann.

## Wie das gelesen werden sollte

"Steht" heißt: es gibt ein Gate, und das Gate ist einmal absichtlich
kaputt gemacht und beim Fallen beobachtet worden. "Halb" heißt: der
messbare Teil steht, der Rest ist benannt. "Offen" heißt: nichts davon
existiert, und die Zeile sagt, warum — Zugangsdaten, ein zweites
Repository, oder einfach Arbeit.

Was hier **nicht** steht, ist ein Datum pro Stufe. Ein Fahrplan mit
erfundenen Terminen ist schlechter als einer ohne, weil er zweimal
enttäuscht.
