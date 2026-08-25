# 0002 — Dreistufige Token-Hierarchie mit Registry-Parität

Status: akzeptiert (2026-08)

## Kontext

Tokens ohne Schichten führen zu hardcodierten Werten in Komponenten
und nicht rebrandbaren Produkten. Tokens ohne maschinenlesbare
Registrierung sind für Generatoren und KI-Assistenten unbrauchbar.

## Entscheidung

Drei Stufen: **primitive** (Rohwerte), **semantic** (Intent; die
Rebranding-/Dark-Mode-Schicht), **component** (Bindungen pro Teil).
Komponenten binden nur an semantic/component. Die CSS-Definitionen
werden 1:1 in `src/tokens.registry.ts` gespiegelt; ein Paritätstest
blockt Drift und erzwingt die Alias-Richtung
(component → semantic → primitive).

## Konsequenzen

- Jedes neue Token braucht CSS + Registry-Eintrag (der Test erzwingt
  beide).
- Rebranding/Dark/Density sind Override-Blöcke auf der semantischen
  Schicht — keine Forks.
- Der Paritätstest ignoriert Override-Blöcke
  (`[data-theme|density|brand]`), da die Registry die light-Werte
  dokumentiert.
