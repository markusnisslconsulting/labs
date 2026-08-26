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
