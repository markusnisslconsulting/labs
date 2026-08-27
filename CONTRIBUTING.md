# Contributing to Labs

## Setup

```sh
pnpm install
pnpm nx serve site        # labs.markusnissl.com lokal (:4300)
pnpm nx storybook ui      # Workbench (:4400)
```

## Was wohin gehört

| Inhalt                    | Ort                                                         |
| ------------------------- | ----------------------------------------------------------- |
| Design-System-Komponenten | `packages/ui/src/components/`                               |
| Token                     | `packages/ui/src/styles/tokens/` + `src/tokens.registry.ts` |
| Produkt-Demos             | `apps/site/src/labs/<slug>/` (Demo + Manifest)              |
| Logik mit Tests           | `packages/<name>` (eigene Nx-Projekte)                      |

Zwei Grenzen werden erzwungen: Apps importieren nur über
Package-Eintrittspunkte, und Component-Tokens stehen auf der
Docs-Seite des Parts — nicht in Foundations.

## Der Weg herein

Erst ein RFC, dann Code. Das Formular unter _Issues → Komponente
vorschlagen_ stellt fuenf Fragen, und zwei davon sind der eigentliche
Zweck: **wer braucht sie sonst** und **was ersetzt sie**.

Eine Komponente, die genau ein Produkt braucht, gehoert in dieses Produkt.
Das ist keine Absage. Ein Design-System, das jede Anfrage aufnimmt, wird
zu einer Sammlung von Sonderfaellen, die niemand zweimal benutzt — und der
Weg zurueck ist offen, sobald ein zweites Produkt sie will.

Was das RFC nicht braucht: fertigen Code, ein Figma-File, eine
Aufwandsschaetzung.

## Die Latte

Was "reviewed" heisst, in Reihenfolge — technisch zuerst, weil das billig
zu pruefen ist, und dann das, was nur ein Mensch sehen kann.

1. **`pnpm gates` ist gruen.** Sechzehn Targets, dieselbe Liste wie CI.
   Kein Review beginnt vorher; das ist kein Ritual, es spart beiden
   Seiten die Runde.
2. **Angeschaut.** `nx run ui:visual-sweep` rendert jede sichtbare Story
   in zwei Engines. Beide Renderfehler, die zuletzt bis zu Markus
   durchgekommen sind, waren engine-spezifisch und in genau der Engine
   unsichtbar, die die Pipeline benutzt hat. Ein Gate, das eine
   DOM-Eigenschaft prueft, ersetzt das Hinschauen nicht.
3. **Die Achsen halten.** Generalisieren die Props, oder traegt die
   Komponente noch ein Produkt-Detail?
4. **Der Vertrag steht in der Doku.** "Use it for" und "reach for
   something else when", die Accessibility-Zeile, und was der Aufrufer
   noch selbst schuldet. `ui:inventory` prueft, dass die Saetze da sind.
5. **Wer prueft.** Heute ein Maintainer, siehe `CODEOWNERS`. Das ist eine
   Einzelperson und damit der Engpass dieses Systems — laenger als eine
   Person es tragen kann, waechst es nicht. Das steht hier, weil es eine
   Eigenschaft des Systems ist und nicht ein Versehen.

## Antwortzeiten

Vorhersagbarkeit ist der Grund, aus dem ein Team ein System benutzt statt
es zu forken. Also Zusagen statt Absichten:

| Was                               | Erste Antwort | Entscheidung                               |
| --------------------------------- | ------------- | ------------------------------------------ |
| Fehler, der ein Produkt blockiert | 1 Werktag     | so schnell es geht, mit Umweg falls noetig |
| Fehler, sonst                     | 3 Werktage    | im naechsten Zyklus eingeordnet            |
| Pull Request                      | 3 Werktage    | 2 Wochen                                   |
| Komponenten-RFC                   | 1 Woche       | 2 Wochen, ja/nein/spaeter mit Grund        |

"Erste Antwort" heisst gelesen und einsortiert, nicht geloest. Eine
Antwort, die "das dauert bis Maerz" sagt, ist mehr wert als Stille.

Der Fahrplan liegt in `docs/roadmap.md` und nennt pro Stufe, was steht
und was nicht.

## Komponenten beitragen

1. **Base UI zuerst prüfen:** Interaktive Komponenten sitzen auf
   [`@base-ui-components/react`](https://base-ui.com)-Parts
   (Fokus-Management, ARIA, Keyboard). Native Plattform-Elemente
   bleiben, wo das Widget selbst die beste A11y ist (Button,
   RadioGroup, TextField, Select, Breadcrumb, Pagination).
   Abweichungen als ADR (`docs/adr/`).
2. **Props, keine Use-Case-Varianten:** Achsen, die generalisieren
   (`variant`, `tone`, `size`), keine Einzelfall-Varianten.
3. **Slots nach Regel:** Prop-Slots für kleinen Inline-Inhalt, den die
   Komponente stylen muss (`leading`, `prefix`); Compound-Slots in
   place für strukturelle Regionen (`Card.Header`). Niemals
   `child.type`-Filterung.
4. **Tokens auf drei Stufen:** Komponenten binden an semantic- oder
   component-tokens, nie an primitive Werte. Der Paritätstest
   (`test/tokens.spec.ts`) blockt Drift.
5. **Stories mit Aussage:** Jede Komponente bekommt Stories für alle
   Zustände; Plays behaupten Semantik (Rollen, Attribute), nicht
   Pixel. Axe-Findings failen (`a11y: { test: "error" }`).

## Gates vor jedem Push

```sh
pnpm gates                        # genau die Targets, die CI faehrt
pnpm nx run ui:visual-test        # lokal, gegen committed baselines
pnpm nx run ui:visual-sweep       # Kontaktabzuege zum Anschauen, kein Gate
```

`pnpm gates` steht in der package.json und nennt dieselbe Liste wie der
Gates-Schritt in `.github/workflows/ci.yml`. Vorher stand die Liste hier
zweimal, an zwei Orten gepflegt, und hier fehlten drei Targets —
`package-check`, `tokens-dtcg` und `adoption`. Genau `tokens-dtcg` ist
dann in CI umgefallen, nachdem lokal alles gruen war: neue Tokens ohne
neu geschriebenen DTCG-Export.

CI läuft affected; Axe- und Test-Findings blockieren Deploys.

## Releases

`pnpm nx release --dry-run` für Vorschau, `pnpm nx release` für
Version + Changelog der Packages (Konfiguration in `nx.json`).

## Entscheidungen

Architektur-Entscheidungen werden als kurze ADRs festgehalten:
`docs/adr/` — Nummer, Status, Kontext, Entscheidung, Konsequenzen.
Große Richtungen (Base UI als Headless-Foundation, Token-Tiers,
Labs-Registry) haben je eine.
