# 0010 — Stand 2026: was übernommen wurde und was nicht

Status: akzeptiert (2026-08)

## Kontext

Der Anspruch war, dieses Repo gegen das zu prüfen, was 2026 über
Designsysteme geschrieben wird, statt gegen das, was wir für richtig
halten. Was dabei fehlte, ist umgesetzt. Was wir bewusst nicht
übernommen haben, steht hier mit dem Grund, weil eine Entscheidung
gegen eine verbreitete Praxis mehr Erklärung braucht als eine dafür.

## Übernommen

**W3C Design Tokens (DTCG).** Das Format hat im Oktober 2025 seine erste
stabile Fassung erreicht, getragen von Adobe, Figma, Google, Microsoft,
Salesforce, Shopify und Tokens Studio. Damit ist es das Austauschformat,
und eine Registry, die nur TypeScript spricht, ist für genau eine
Toolchain lesbar. `scripts/tokens/dtcg.ts` erzeugt sie, `ui:tokens-dtcg`
hält sie aktuell.

Ein Detail, das die Recherche als das mit dem höchsten Ertrag benennt:
Komponenten dürfen die Primitiv-Ebene nicht anfassen. Das galt hier für
Farben und nicht für Radius, Schrift und Schatten — deshalb war die
Marken-Achse auf Farbe beschränkt. Behoben, siehe ADR 0002.

**React Server Components.** Keine Komponente trug `"use client"`. In
einer Next.js-App bricht damit jede interaktive Komponente, und zwar im
Build des Konsumenten. Elf der vierunddreißig rendern jetzt bewusst auf
dem Server; ein Gate prüft beide Richtungen, weil eine Direktive an der
falschen Stelle React für nichts in das Client-Bundle zieht.

**publint und attw.** Beschrieben als die Standardprüfung jeder ernsten
Bibliothek. Sie haben beim ersten Lauf sechs echte Fehler in der
Verpackung gefunden. Details in ADR 0009.

**Codemods.** Material UI und Chakra liefern sie zu jeder Deprecation.
Unsere Ratsche verhinderte neue Verwendungen und hat die bestehenden
nicht bewegt; `scripts/tokens/codemod.ts` schließt das.

**Component Coverage.** Die Reifegradmodelle nennen sie als erste
Metrik. Gemessen: 29,5 Prozent, und 29 von 34 Komponenten ohne
Konsumenten. Das war die unangenehmste Zahl der Prüfung und der Grund für
die Konsolidierung, die darauf folgte.

**Status-Badges.** Die Tags gab es schon, gerendert hat sie niemand.

## Nicht übernommen

**APCA statt WCAG 2 für Kontrast.** Verbreitete Empfehlung, hier
abgelehnt. Die Begründung ist der Stand des Standards: die
Kontrast-Arbeit wurde im Juli 2023 aus dem WCAG-3-Arbeitsentwurf
herausgenommen, der aktuelle Entwurf sagt zum Algorithmus „yet to be
determined", und WCAG 3 wird nicht vor Ende des Jahrzehnts
Empfehlungsstatus erreichen. WCAG 2.2 AA ist der Maßstab, an dem
Barrierefreiheit heute rechtlich gemessen wird, und ein Gate, das gegen
etwas anderes prüft, prüft nicht die Verpflichtung.

Was an APCA richtig ist, bleibt richtig: es berücksichtigt Schriftgröße
und -gewicht, WCAG 2 nicht. In der Praxis übertrifft eine Farbkombination,
die APCA für ihre Größe besteht, die WCAG-2-Mindestwerte fast immer —
also verliert man durch das strengere alte Verfahren wenig. Sollte WCAG 3
einen Algorithmus festlegen, ist `scripts/tokens/contrast.ts` die eine
Datei, die sich ändert.

**Tailwind oder CSS Modules.** Beide werden 2026 als der Weg für
Server-Components-Kompatibilität genannt, und beide sind hier gegenstandslos:
wir schreiben CSS mit Cascade Layers und Custom Properties, was nativ mit
RSC funktioniert und keinen Build-Schritt im Konsumenten braucht. Der
Hinweis richtet sich gegen CSS-in-JS, und das benutzen wir nicht.

**Ein Storybook pro Paket, Nx Agents, erzwungene Conventional Commits.**
Begründet in ADR 0009, jeweils mit der Schwelle, ab der sie sich lohnen.

## Was die Prüfung über die Gates gesagt hat

Zwei Dinge, die sich wiederholt haben und in jedes neue Gate gehören:

1. **Ein Gate braucht eine Sanity-Behauptung über sich selbst.** Die
   forced-colors-Prüfungen liefen grün, während die Emulation nicht
   ankam, und haben selected gegen unselected verglichen — was auch im
   normalen Modus unterschiedlich ist. Gemerkt hat es nur der Test, der
   fragt, ob der Modus überhaupt aktiv ist.
2. **Ein Gate wird gegengeprobt, indem man den Fehler absichtlich wieder
   einbaut.** Jedes in dieser Sitzung entstandene Gate ist so geprüft,
   und zwei davon haben dabei gezeigt, dass sie das Falsche messen.
