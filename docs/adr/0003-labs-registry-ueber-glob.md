# 0003 — Labs-Registry über Glob statt zentraler Liste

Status: akzeptiert (2026-08)

## Kontext

Eine zentrale Import-Liste für Labs skaliert schlecht: das hundertste
Labor kostet eine Änderung an einer wachsenden Datei, Konflikte
inklusive.

## Entscheidung

`import.meta.glob` scannt `apps/site/src/labs/*/lab.tsx` zur
Build-Zeit. Ein Labor registriert sich durch Existenz; das Manifest
(LabMeta) trägt Titel, Zusammenfassung, Erklärung, Tags, Artikel- und
Quellen-Link sowie optional die Demo.

## Konsequenzen

- Übersicht, Suche, Tag-Filter und Routing lesen aus der Registry —
  das hundertste Labor kostet wie das erste.
- Tippfehler im Manifest fallen zur Build-Zeit auf (typisiert).
- Die Reihenfolge folgt den Ordnernamen; kuratieren passiert über
  Namen, nicht über eine Liste.
