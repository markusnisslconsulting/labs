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
| 04  | Formulare als System                               | steht             |
| 05  | Zustände und Skalierung erstklassig                | steht             |
| 06  | Barrierefreiheit jenseits der automatisierten 40 % | halb              |
| 07  | Distribution und der Versionsvertrag               | halb              |
| 08  | ~~Design und Code als eine Quelle~~                | gestrichen        |
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

## 04 — Formulare als System (steht)

`Field` steht: eine Stelle für Label, Hint, Error, Required und die
Verdrahtung, und alle neun Feld-Komponenten benutzen sie. Vorher trugen
neun Felder alle ein `label`, zwei ein `hint`, **eins** ein `error` und
keins `required` — ein verpflichtendes Select mit Validierungsfehler war
nicht ausdrückbar.

`Form` steht jetzt darüber. Fehler kommen als Abbildung von Feldnamen auf
Meldungen, also in der Form, in der ein Server sie liefert, und jedes Feld
findet seinen eigenen. Dazu `Form.Summary` mit Sprungmarken, die den
**Fokus** setzen und nicht nur scrollen, `Form.Group` als echtes Fieldset
mit Legende, ein `busy`-Zustand, und `summaryOn` für den Unterschied
zwischen "beim Absenden prüfen" und "der Server hat schon geantwortet".

Zwei Defekte, die dabei herausgefallen sind, gehören in die Zeile, weil
sie sagen, warum diese Stufe nicht vorher stand:

**`aria-describedby` kam aus dem falschen Wert.** `Field` hat die
Beschreibung aus der eigenen `error`-Prop berechnet und die Meldung aus dem
tatsächlich geltenden Fehler gerendert. Ein Fehler aus der Form war damit
sichtbar, `aria-invalid` gesetzt, und die Beschreibung zeigte auf nichts.
Kein Bild-Test kann das sehen. Dieselbe Verwechslung hat in `Checkbox`,
`Switch` und `RadioGroup` die Meldung ganz unterdrückt.

**Die Übersicht wurde zweimal geschrieben.** Felder melden sich in einem
Effekt an, also hatte im ersten Durchlauf kein Fehler einen Besitzer, und
alle nahmen den Zweig für "Fehler ohne Feld". Die Übersicht rendert also
die Meldungen ohne Feldnamen und ersetzt sie danach durch Links. Der
Bereich ist `role="alert"`. Gemessen: **5 Schreibvorgänge vorher, 1
nachher**, und `browser/announce.spec.ts` zählt sie seitdem. Genau das,
wonach `docs/screen-reader-pass.md` bei `Toaster` hören lässt — hier hat es
eine Zählung gefunden, weil beide Zustände am Ende gleich aussehen.

Und ein Fund, der ohne den ersten Fund verborgen blieb: `Button` setzt
`type="button"`, richtig so, weshalb in keiner Story ein Formular
überhaupt absenden konnte. Mit `type="submit"` lud die Testseite neu —
`Form` hat `preventDefault` nie gerufen. Jetzt ruft es das, außer wenn ein
`action` gesetzt ist; ein Formular ohne Ziel sendet an die eigene URL und
verliert alles Getippte. Zwei Fehler, von denen der erste den zweiten
verdeckte, sind der Grund, warum "die Tests sind grün" und "die Komponente
funktioniert" verschiedene Aussagen sind.

Offen bleibt nichts Benanntes. Validierungszeitpunkte pro Feld (bei
Änderung, bei Verlassen) sind bewusst nicht drin: was gültig ist, ist die
Regel des Aufrufers, und eine Bibliothek, die das übernimmt, besitzt am
Ende Geschäftslogik.

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

Der konkrete Einstieg steht in `docs/screen-reader-pass.md`: sechs
Komponenten, eine Paarung, etwa vierzig Minuten — TextField, Select,
Dialog, Toaster, Tabs, Table. Nicht 105 Zellen, weil eine Liste mit 105
Zeilen niemand anfängt. Der Zettel sagt auch, wonach _nicht_ zu suchen
ist: Namen, Beschreibungen, Rollen und Reihenfolge deckt
`browser/announce.spec.ts` ab. Gehört wird, ob das Gesagte für einen
Menschen brauchbar ist — zu viel, zu wenig, falsche Reihenfolge, oder
zweimal.

Ebenfalls offen: die 11 manuellen WCAG-Kriterien einmal durchgehen und
datieren. Sie stehen mit ihrem jeweiligen "wonach schauen" in
`packages/ui/src/audit/wcag.ts`.

## 07 — Distribution (halb)

Steht: die Paketform ist geprüft (publint, attw), jeder CSS-Import im
Build löst auf, ein Consumer-Bundle beweist, dass eine Komponente eine
Komponente kostet, und das Deprecation-Fenster hat Daten samt Gate, das
fällt, wenn eine Frist verstreicht.

Offen und ohne Zugangsdaten nicht machbar: in eine private Registry
veröffentlichen, Canary-Builds aus `main`, und der Versions-Spread über
die Consumer — die echte Version eines Design-Systems ist die älteste, die
noch in Produktion läuft.

Semver pro Komponente hat jetzt seine Grundlage: `packages/ui/api-surface.md`
hält jede exportierte Signatur ohne Prosa, und `ui:api-surface` fällt, wenn
sie abdriftet. Damit ist "welche Komponente hat sich bewegt" eine Zeile im
Diff statt eine Lesearbeit, und `CHANGELOG.md` führt pro Komponente mit
Stufe — breaking, added, fixed, internal.

Offen daran: die Durchsetzung, dass ein Eintrag existiert, wenn die Fläche
sich ändert. Das braucht die Merge-Basis, die CI über `nx affected` schon
kennt.

## 08 — Design und Code als eine Quelle (gestrichen)

Gestrichen, nicht verschoben. Figma-Variablen, Code Connect und ein
Inventar-Diff brauchen alle eine Figma-Lizenz, die es hier nicht gibt und
für die es keinen Plan gibt.

Eine Stufe, die auf unbestimmte Zeit "offen" steht, ist kein Fahrplan
mehr, sondern eine Liste von Dingen, die man mal wollte — und sie
verschiebt das Gewicht der anderen elf. Der DTCG-Export bleibt, weil er
für sich nützlich ist: er macht den Token-Graph portabel, egal ob jemals
ein Design-Werkzeug daraus liest.

Falls sich das ändert, ist der Einstieg einseitig: Figma-Variablen **aus**
dem DTCG-Export generieren, Code bleibt die Quelle. Zwei-Wege-Sync ist die
Stelle, an der das schiefgeht.

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

## 11 — Observability (offen, braucht eine Liste von Repos)

Adoption wird heute gemessen, indem dieses Repository seinen eigenen
Quellcode liest. Das trägt für einen Consumer und nicht für eine Firma.

Was gebaut würde, in der Reihenfolge, in der es Nutzen bringt:

**1. Ein statischer Scanner, als eigenes Target.** Er klont die Consumer
flach, liest ihre `package.json` für die `@labs/ui`-Version und greppt
ihren Quellcode gegen `packages/ui/inventory.json` — das gibt es jetzt,
und es ist der Grund, warum dieser Schritt inzwischen klein ist. Ausgabe
pro Repo: Version, benutzte Komponenten, benutzte Props pro Komponente,
benutzte Tokens, und die Zahl, die am meisten sagt — **Stellen, die
aussehen wie ein Nachbau**: ein `<button className=` ohne `uix-button`,
eine Hex-Farbe in einer CSS-Datei, ein `border-radius` in px.

**2. Der Versions-Spread.** Die echte Version eines Design-Systems ist die
älteste, die noch in Produktion läuft. Eine Tabelle Repo → Version, mit
dem Abstand zur neuesten, ist die Zahl, die entscheidet, ob eine
Deprecation-Frist realistisch war.

**3. Ein Report im CI dieses Repos**, damit die Zahl sich bewegt, ohne
dass jemand daran denken muss — genau wie `ui:adoption` heute.

Was ich dafür brauche, und nur das:

- **Die Liste der Repos**, die `@labs/ui` benutzen sollen oder sollten.
  Auch die, die es noch nicht tun — "sollte und tut nicht" ist die
  interessantere Hälfte.
- **Lesezugriff** darauf. Ein Fine-grained-Token mit `contents: read` auf
  diese Repos, als Secret; oder, falls alle in derselben Organisation
  liegen, reicht `GITHUB_TOKEN` mit erweitertem Scope.

Runtime-Telemetrie steht ausdrücklich hinten an: "welche Props werden in
Produktion benutzt" ist eine andere Frage als "welche werden importiert",
aber sie braucht ein Flag, eine Einwilligung und einen Endpunkt — und der
statische Scanner beantwortet 80 % davon ohne all das.

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
