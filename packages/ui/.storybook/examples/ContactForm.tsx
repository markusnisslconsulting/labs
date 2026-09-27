import { useState, type FormEvent } from "react";
import { Button } from "../../src/components/Button";
import { Form } from "../../src/components/Form";
import { Stack } from "../../src/components/Stack";
import { TextField } from "../../src/components/TextField";

export function ContactForm() {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid = name.trim().length > 0;
    setErrors(valid ? {} : { name: "Enter a name for this workshop request." });
    setSaved(valid);
  }

  return (
    <Form noValidate errors={errors} onSubmit={save}>
      <Stack gap="md">
        <Form.Summary />
        <TextField
          name="name"
          label="Contact name"
          hint="Use a fictional name. This example sends no data."
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors({});
            setSaved(false);
          }}
        />
        <Form.Actions>
          <Button type="submit">Save example</Button>
        </Form.Actions>
        <p role="status">{saved ? "Request saved in this example." : ""}</p>
      </Stack>
    </Form>
  );
}
