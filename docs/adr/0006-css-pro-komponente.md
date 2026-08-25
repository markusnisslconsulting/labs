# 0006 — CSS reist mit der Komponente, Reihenfolge über @layer

Status: akzeptiert (2026-08)

## Kontext

Ein einziges `styles.css` mit allen Komponenten hieß: eine Seite mit
einem Badge lud 30,4 kB CSS für 33 Komponenten. Aufteilen heißt aber,
dass die Einfügereihenfolge der Stylesheets der Ladereihenfolge folgt
und nicht mehr der Autorenreihenfolge — und damit entscheidet das Netz
über die Kaskade.

## Entscheidung

Jede Komponente importiert ihr eigenes Stylesheet. `styles.css` ist nur
noch der Boden: Token-Schichten, Brands, Element-Defaults.

Die Reihenfolge wird einmal deklariert:

```css
@layer tokens, base, components, overrides;
```

Jedes Komponenten-Stylesheet liegt in `@layer components`. Ein Chunk,
der spät im Netz ankommt, landet damit trotzdem an der richtigen Stelle
und kann weder die Tokens noch die `overrides` eines Produkts schlagen.

Konsumiert wird über Subpath-Exports (`@labs/ui/components/Button`). Der
Barrel bleibt für Prototypen, zieht aber jedes Stylesheet mit, weil ein
CSS-Import ein Side Effect ist und nicht wegoptimiert werden kann.

## Konsequenzen

- Erste Ladung der Labs-Seite: 30,4 kB → 11,3 kB.
- Der Library-Build braucht ein Plugin: der Library-Modus extrahiert das
  CSS pro Entry, entfernt aber den `import "./X.css"` aus dem JS. Ohne
  das Plugin müssten Konsumenten Stylesheets von Hand importieren —
  genau die Kopplung, die der Split beseitigen soll.
- `@layer` ist Pflicht, nicht Kosmetik. Ohne die Deklaration wäre der
  Fehler intermittierend und nur bei kaltem Cache reproduzierbar.
