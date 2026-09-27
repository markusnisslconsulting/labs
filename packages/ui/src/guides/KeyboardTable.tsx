import { KEYBOARD_MAP, type KeyboardRow } from "../keyboard.map";
import { Stack } from "../components/Stack";
import { Table } from "../components/Table";

function byComponent(rows: KeyboardRow[]) {
  const groups = new Map<string, KeyboardRow[]>();
  for (const row of rows) {
    const list = groups.get(row.component) ?? [];
    list.push(row);
    groups.set(row.component, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function KeyboardTable() {
  return (
    <Stack gap="xl">
      {byComponent(KEYBOARD_MAP).map(([component, rows]) => (
        <Stack gap="md" renderAs={<section />} key={component}>
          <h3>{component}</h3>
          <Table caption={`${component} keyboard behavior`}>
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Expected behavior</th>
                <th scope="col">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.component}-${row.key}`}>
                  <th scope="row">
                    <kbd>{row.key}</kbd>
                  </th>
                  <td>{row.expectation}</td>
                  <td>{row.owner === "platform" ? "Browser" : "Component"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Stack>
      ))}
    </Stack>
  );
}
