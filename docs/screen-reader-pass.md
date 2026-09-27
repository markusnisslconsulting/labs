# Screen-reader testing

Browser tests check selected accessible names, descriptions, roles, states and
reading order. A screen-reader session checks whether the spoken information and
interaction let someone complete the task. No completed manual passes are
currently recorded.

## Prepare a session

Start Storybook with `pnpm nx run ui:storybook`. Choose a browser and reader
pairing from `packages/ui/src/audit/screen-readers.ts`. Record their versions,
the operating system, the date and the story or page being tested.

Use fictional content and work through the complete interaction. Test at least
one error or unavailable state as well as the successful path.

## Follow the task

- **Fields:** find the label, instructions and required state; enter a value,
  trigger an error and correct it. Check that messages are associated and are
  not announced twice.
- **Choice controls:** change a checkbox, switch or radio selection. Check the
  control's name, current state and group context.
- **Dialogs and drawers:** open the layer, read its title and content, navigate
  inside it, close it and confirm that focus returns appropriately. A modal
  must prevent interaction with the background.
- **Menus and tabs:** move through the options using the documented keys. Check
  that focus and selection are distinguishable and unavailable items are clear.
- **Notifications:** trigger a status update while focus is elsewhere. Check
  whether it is announced at a useful time without unnecessary interruption.
- **Pages:** follow navigation, headings, form errors and completion messages in
  reading order. Repeat in the intended writing direction.

## Record the result

Use the matching cell in `packages/ui/src/audit/screen-readers.ts` for the date
and observed result. Include the tested versions, steps, spoken output and any
discrepancies. Distinguish a completed check from an unresolved question; an
unfilled cell remains unchecked.

Report actionable component defects with a reproducible example. Application
content and integrations also need their own checks.
