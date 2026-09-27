# FAQ composition

Source mapping: the main site's `src/components/home/Faq.tsx` uses a section
heading and a list of questions, with the first answer initially open. This
example preserves the one-answer-at-a-time behavior using `Section` and the
compound `Accordion` parts. Its workshop content is fictional and stored in
`content.ts`; it imports no main-site copy or source.

For an existing FAQ, replace custom disclosure buttons, panel IDs and conditional
panel rendering with `Faq`. Keep stable question IDs and product content in the
owning feature:

```tsx
<Faq
  id="workshop-questions"
  title={copy.title}
  description={copy.description}
  items={copy.questions.map((question) => ({
    id: question.id,
    question: question.title,
    answer: question.body,
  }))}
  defaultValue={[copy.questions[0].id]}
/>
```

Use `value` and `onValueChange` together when the owning feature needs controlled
state; omit `value` to let Accordion manage state from `defaultValue`. Do not keep
a second local toggle state in the wrapper. Question and answer slots accept React
nodes, so links and structured answer content do not require new variant props.

Tab reaches the triggers, Enter/Space toggles, and arrow keys move between them.
Opening an answer closes the previous answer, and the open answer can be closed.
The site browser suite checks those interactions and includes this route in the
light/dark layout and accessibility matrix at four widths.
