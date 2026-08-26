# 0009 — Aufbau: ein Storybook, drei Testarten, Grenzen als Lint-Regel

Status: akzeptiert (2026-08)

## Kontext

Dieses Repo soll zeigen, wie ein Designsystem mit Nx und Storybook
aufgesetzt wird, wenn man es ernst meint. Der Anspruch ist nicht
Vollständigkeit, sondern dass jede Entscheidung eine Begründung hat, die
man in einem Review verteidigen kann — und dass die Entscheidungen, die
sich als falsch erwiesen haben, mit ihrem Grund dokumentiert sind.

## Ein Storybook, nicht eines pro Paket

`packages/ui` ist das einzige Paket mit Stories, und das ist keine
Bequemlichkeit: die anderen Pakete sind Logik ohne Oberfläche. Ein
Storybook pro Paket kostet einen Build, einen Chromatic-Projekt-Slot und
eine eigene Adresse pro Paket, und der Gewinn wäre null, solange es
nichts zu zeigen gibt.

**Wann man wechselt:** sobald Produktteams eigene Komponenten haben, die
sie nicht ins Designsystem geben. Dann Storybook Composition (`refs`):
jedes Team baut sein eigenes, das Designsystem-Storybook bindet sie ein.
Nicht ein gemeinsames Storybook mit Globs über fremde Pakete — das macht
den Build eines Teams zum Blocker für alle anderen.

## Drei Testarten, und die Grenze zwischen ihnen

Die Trennung ist nach **Laufzeitumgebung**, nicht nach Testart, weil das
die Grenze ist, die man beim Debuggen wissen muss.

| Ziel                | Läuft in            | Prüft                                                                                                                                      |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ui:test`           | Node, Vitest        | Was auf der Platte steht: Token-Parität, Registry, CSS-Regeln, Stories als Text                                                            |
| `ui:test-storybook` | Browser, Vitest     | Jede Story: `play()`, Semantik, axe — zweimal, hell und dunkel                                                                             |
| `ui:browser-test`   | Browser, Playwright | Was keine einzelne Story behaupten kann: Docs-Seiten, Kontrollskala über Dichte und Schriftgröße, 360px, forced-colors, Theme-Achse, Druck |

`ui:test` zahlt keinen Browser, weil es Dateien liest. `ui:browser-test`
ist Playwright und nicht das Storybook-Addon, weil es Medien emulieren
muss — `forcedColors`, `colorScheme`, `media: print`, Viewport — und weil
seine Fälle keine Stories sind.

**Story-Tests laufen über `@storybook/addon-vitest`.** Der frühere
`@storybook/test-runner` ist abgekündigt und hat bei jedem Lauf darauf
hingewiesen. Der Umstieg war schneller (145 Tests in 3,5s statt 6,2s) und
hat sofort einen Fehler gezeigt, den der alte Runner verschluckt hatte,
weil er die Browser-Konsole nicht gelesen hat.

**Die Suite läuft zweimal, hell und dunkel.** Ein Lauf nur in Hell hat
drei Dark-Mode-Fehler durchgelassen. Umgesetzt über eine Env-Variable in
`initialGlobals`, nicht über eine zweite Vitest-Konfiguration: eigene
`setupFiles` schalten die automatische Annotation-Bereitstellung des
Addons ab.

## Grenzen sind eine Lint-Regel, nicht eine Vereinbarung

`@nx/enforce-module-boundaries` mit zwei Achsen. `scope` beantwortet
„wessen Code darf ich benutzen", `type` beantwortet „in welcher Schicht
liege ich".

    type:app      -> type:feature, type:ui
    type:feature  -> type:ui
    type:ui       -> nichts

Nur `scope` reichte nicht: `packages/ui` und `packages/reorder-desk` sind
beide `scope:shared`, also hätte ein Button in einen Produktscreen greifen
können. Ein Designsystem, das von einem Produkt abhängt, ist keins mehr.

## Was in `nx.json` steht und warum

- **`namedInputs.production`** schließt Tests und Stories aus, damit eine
  Story-Änderung keinen Build-Cache invalidiert.
- **`targetDefaults.*.dependsOn: ["^build"]`** — Typecheck und Storybook
  brauchen die gebauten Abhängigkeiten, nicht deren Quellen.
- **`cache: true` überall außer `serve` und `storybook`.** Ein Gate ohne
  Cache wird in CI abgeschaltet, sobald es weh tut.
- **CI läuft `nx affected`** gegen `defaultBase: main`, mit
  `fetch-depth: 0`, weil ein Shallow Clone keine Basis hat.

## Was wir bewusst nicht gemacht haben

- **Nx Agents / verteilte Ausführung.** Bei dieser Größe ist die
  Einrichtung teurer als der gesamte CI-Lauf. Ab etwa zehn Minuten
  Laufzeit lohnt es sich.
- **Ein Storybook pro Paket.** Siehe oben.
- **commitlint / Conventional Commits erzwungen.** `nx release` kann
  Changelogs daraus bauen, aber ein erzwungenes Präfix ersetzt keine
  Commit-Nachricht, die den Mechanismus erklärt. Die Konvention hier ist
  Prosa mit Messwerten.
- **Pre-Commit-Hooks für die volle Gate-Liste.** Die Browser-Gates
  brauchen einen Build; das gehört in CI und nicht zwischen `git commit`
  und Mittagessen. Format und Lint wären vertretbar.
- **Storyshots.** Chromatic macht das, und ein Snapshot im Repo ist ein
  Diff, den niemand liest.

## Konsequenzen

Drei Playwright-Konfigurationen (`packages/ui` für die Bibliothek,
`apps/site` für die Seite, `visual/` für die lokalen Screenshots) sind
eine mehr als schön wäre. Sie bleiben getrennt, weil sie verschiedene
Server hochfahren und verschiedene Basis-URLs brauchen; eine gemeinsame
Konfiguration mit drei Projekten wäre der nächste Schritt, wenn eine
vierte dazukommt.
