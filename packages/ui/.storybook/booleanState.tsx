import type { Decorator } from "@storybook/react-vite";
import { useState } from "react";
import { useArgs } from "storybook/preview-api";

function BooleanExample({
  Story,
  args,
  value,
  event,
  updateArgs,
}: {
  Story: Parameters<Decorator>[0];
  args: Record<string, unknown>;
  value: string;
  event: string;
  updateArgs: (args: Record<string, unknown>) => void;
}) {
  const requested = args[value];
  // Portable tests need local state; the manager also receives the new value.
  const [local, setLocal] = useState({ requested, current: requested });
  let current = local.current;
  if (local.requested !== requested) {
    current = requested;
    setLocal({ requested, current });
  }
  return (
    <Story
      args={{
        ...args,
        [value]: current,
        [event]: (next: boolean) => {
          setLocal({ requested, current: next });
          updateArgs({ [value]: next });
          if (typeof args[event] === "function") args[event](next);
        },
      }}
    />
  );
}

/** Keep a controlled example and its Controls toggle in sync. */
export function booleanState(value: string, event: string): Decorator {
  return (Story) => {
    const [args, updateArgs] = useArgs();
    return (
      <BooleanExample
        Story={Story}
        args={args}
        value={value}
        event={event}
        updateArgs={updateArgs}
      />
    );
  };
}
