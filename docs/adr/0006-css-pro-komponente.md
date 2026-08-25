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

## Nachtrag (2026-08): die Deklaration allein genügt nicht

Die `@layer`-Deklaration stand in `styles.css` und galt im Bundle
trotzdem nicht. Die Reihenfolge der Ebenen steht fest, sobald ein Name
das erste Mal auftaucht — und im Bundle taucht `components` zuerst auf,
weil Komponenten-CSS über JS-Imports kommt und vor den `@import`s der
Entry-Datei landet. Die Deklaration stand zwei Kilobyte später und war
damit wirkungslos.

Die Folge war still und vollständig: `components` rangierte **unter**
`base`, also schlug `button { color: inherit }` jede Komponentenfarbe.
Sichtbar wurde es an einer Stelle, an einem aktiven Chip mit navy Text
auf navy Fläche.

Zwei Korrekturen:

- `tools/vite-layer-order.ts` stellt die Deklaration an den Anfang jedes
  emittierten Stylesheets und prüft das Ergebnis danach.
- lightningcss schrieb `@layer a, b, c;` auf die eine Ebene zusammen,
  für die es keinen Block fand. Die App minifiziert CSS deshalb mit
  esbuild.

Die Lehre für den Artikel: eine Zusicherung, die nicht im Artefakt
geprüft wird, ist keine. Der Test prüfte die Quelldatei; kaputt war das
Bundle.
