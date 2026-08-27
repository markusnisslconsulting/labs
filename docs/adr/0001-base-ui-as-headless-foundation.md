# 0001 — Base UI as the headless foundation for interactive components

Status: accepted (2026-08)

## Context

Interactive components need focus management, roving tabindex, ARIA wiring
and positioning. Implementing that ourselves means testing that behaviour
ourselves; a headless library delivers it already tested.

## Decision

Interactive components (Checkbox, Switch, Accordion, Tabs, Tooltip,
Progress) sit on `@base-ui-components/react` parts. Native platform
elements stay where the widget itself is the best accessibility (Button,
RadioGroup, TextField, Select, Breadcrumb, Pagination). Styling goes
through Base UI's `data-*` state attributes.

## Consequences

- The accessibility behaviour of interactive parts is Base UI's tested
  surface; our stories check markup, styling and semantics, not the
  interaction implementation.
- rc risk: Slider and Combobox adoption deferred (bug #62 in story
  environments), to be revisited at Base UI 1.0; implemented natively until
  then.
- Base UI is a dependency in the product bundle (size checked).
