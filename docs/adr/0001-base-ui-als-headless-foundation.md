# 0001 — Base UI als Headless-Foundation für interaktive Komponenten

Status: akzeptiert (2026-08)

## Kontext

Interaktive Komponenten brauchen Fokus-Management, Roving Tabindex,
ARIA-Verkabelung und Positionierung. Eigene Implementierung bedeutet,
diese Verhaltensweise selbst zu testen; eine Headless-Bibliothek
liefert sie getestet.

## Entscheidung

Interaktive Komponenten (Checkbox, Switch, Accordion, Tabs, Tooltip,
Progress) sitzen auf `@base-ui-components/react`-Parts. Native
Plattform-Elemente bleiben, wo das Widget selbst die beste A11y ist
(Button, RadioGroup, TextField, Select, Breadcrumb, Pagination).
Styling über Base UIs `data-*`-State-Attribute.

## Konsequenzen

- A11y-Verhalten interaktiver Teile ist Base UIs getestete Oberfläche;
  unsere Stories prüfen Markup, Styling und Semantik, nicht die
  Interaktions-Implementierung.
- rc-Risiko: Slider/Combobox-Adoption zurückgestellt (Fehler #62 in
  Story-Umgebungen), Wiedervorlage bei Base UI 1.0; nativ implementiert
  bis dahin.
- Base UI ist eine Abhängigkeit im Produkt-Bundle (~geprüfte Größe).
