# 0004 — Zwei Slot-Muster, keine Type-Filterung

Status: akzeptiert (2026-08)

## Kontext

Slots in React: Prop-Slots, Compound-Komponenten in place, oder
`React.Children`-Type-Filterung (`child.type === Title`).

## Entscheidung

- **Prop-Slots** für kleinen Inline-Inhalt, dessen Styling die
  Komponente besitzt (Button `leading/trailing`, TextField
  `prefix/suffix`).
- **Compound-Slots in place** für strukturelle Regionen mit eigenem
  Layout (Card.Header/Body/Footer, Panel.Header/Body).

Verworfen: Type-Filterung — bricht beim Wrappen eines Slots, bricht
bei doppelten Package-Kopien (Type = Funktionsreferenz) und erlaubt
keine Prop-Injektion in den Slot.
