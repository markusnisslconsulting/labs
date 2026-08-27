# 0010 — State of 2026: what was adopted and what was not

Status: accepted (2026-08)

## Context

The aim was to check this repo against what is being written about design
systems in 2026, rather than against what we happen to think is right. What
was missing has been built. What we deliberately did not adopt is here with
its reason, because a decision against a widespread practice needs more
explanation than one for it.

## Adopted

**W3C Design Tokens (DTCG).** The format reached its first stable version in
October 2025, backed by Adobe, Figma, Google, Microsoft, Salesforce, Shopify
and Tokens Studio. That makes it the interchange format, and a registry that
speaks only TypeScript is readable by exactly one toolchain.
`scripts/tokens/dtcg.ts` generates it and `ui:tokens-dtcg` keeps it current.

One detail the research names as the highest-yield item: components must not
touch the primitive tier. That held here for colours and not for radius,
type and shadow — which is why the brand axis was limited to colour. Fixed,
see ADR 0002.

**React Server Components.** No component carried `"use client"`. In a
Next.js app that breaks every interactive component, and it breaks in the
consumer's build. Eleven of the thirty-four now render on the server
deliberately; a gate checks both directions, because a directive in the
wrong place pulls React into the client bundle for nothing.

**publint and attw.** Described as the standard check of any serious
library. They found six real packaging errors on the first run. Details in
ADR 0009.

**Codemods.** Material UI and Chakra ship one with every deprecation. Our
ratchet prevented new uses and did not move the existing ones;
`scripts/tokens/codemod.ts` closes that.

**Component coverage.** The maturity models name it as the first metric.
Measured: 29.5 per cent, and 29 of 34 components with no consumer. That was
the most uncomfortable number of the review and the reason for the
consolidation that followed.

**Status badges.** The tags already existed; nobody rendered them.

## Not adopted

**APCA instead of WCAG 2 for contrast.** A common recommendation, rejected
here. The reason is the state of the standard: the contrast work was pulled
out of the WCAG 3 working draft in July 2023, the current draft says the
algorithm is "yet to be determined", and WCAG 3 will not reach
recommendation status before the end of the decade. WCAG 2.2 AA is the
yardstick accessibility is legally measured against today, and a gate that
checks something else is not checking the obligation.

What is right about APCA stays right: it accounts for font size and weight,
WCAG 2 does not. In practice a colour combination that passes APCA for its
size almost always exceeds the WCAG 2 minimums — so little is lost by using
the stricter old method. Should WCAG 3 settle on an algorithm,
`scripts/tokens/contrast.ts` is the one file that changes.

**Tailwind or CSS Modules.** Both are named in 2026 as the route to Server
Components compatibility, and both are moot here: we write CSS with cascade
layers and custom properties, which works natively with RSC and needs no
build step in the consumer. The advice is aimed at CSS-in-JS, and we do not
use that.

**A Storybook per package, Nx Agents, enforced conventional commits.**
Reasoned in ADR 0009, each with the threshold at which they pay off.

## What the review said about the gates

Two things that recurred and belong in every new gate:

1. **A gate needs a sanity claim about itself.** The forced-colors checks
   ran green while the emulation was not arriving, and were comparing
   selected against unselected — which differ in normal mode too. The only
   thing that noticed was the test asking whether the mode was active at
   all.
2. **A gate is verified by deliberately reintroducing the bug.** Every gate
   created in that session is checked that way, and two of them thereby
   showed that they were measuring the wrong thing.
