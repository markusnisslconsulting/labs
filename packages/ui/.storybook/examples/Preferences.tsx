import { useState } from "react";
import { Button } from "../../src/components/Button";
import { Checkbox } from "../../src/components/Checkbox";
import { Stack } from "../../src/components/Stack";

export function Preferences() {
  const [reminders, setReminders] = useState(false);

  return (
    <Stack gap="md">
      <Checkbox
        label="Workshop reminders"
        hint="This example changes a local preference. It sends no messages."
        checked={reminders}
        onCheckedChange={setReminders}
      />
      <p role="status">Reminders are {reminders ? "on" : "off"}.</p>
      <div>
        <Button variant="outline" onClick={() => setReminders(false)}>
          Reset preference
        </Button>
      </div>
    </Stack>
  );
}
