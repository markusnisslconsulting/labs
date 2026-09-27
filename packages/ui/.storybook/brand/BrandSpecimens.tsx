/// <reference types="vite/client" />
import { useState, type CSSProperties } from "react";
import { consulting } from "@labs/brand";
import navyLogo from "@labs/brand/logos/navy.webp";
import whiteLogo from "@labs/brand/logos/white.webp";
import redLogo from "@labs/brand/logos/red.webp";
import blackLogo from "@labs/brand/logos/black.webp";
import { Columns } from "../../src/components/Columns";
import { Stack } from "../../src/components/Stack";
import { Cluster } from "../../src/components/Cluster";
import { Panel } from "../../src/components/Panel";
import { Table } from "../../src/components/Table";
import { Button } from "../../src/components/Button";
import { TextField } from "../../src/components/TextField";
import { contrastRatio } from "./contrast";
import "./BrandSpecimens.css";

const { palette, logo, labs } = consulting;

export function LogoSpecimens() {
  const variants = [
    {
      name: "Navy",
      src: navyLogo,
      background: palette.paper,
      colour: palette.navy,
      use: "Light backgrounds",
    },
    {
      name: "White",
      src: whiteLogo,
      background: palette.navy,
      colour: palette.paper,
      use: "Dark backgrounds",
    },
    {
      name: "Red",
      src: redLogo,
      background: palette.paper,
      colour: palette.navy,
      use: "Brand artwork",
    },
    {
      name: "Black",
      src: blackLogo,
      background: palette.paper,
      colour: palette.navy,
      use: "Single-colour reproduction",
    },
  ];
  return (
    <Stack gap="xl" className="brand-specimens">
      <Columns min="sm">
        {variants.map((variant) => (
          <Panel key={variant.name}>
            <Stack gap="md">
              <figure
                className="brand-logo-stage"
                style={{
                  backgroundColor: variant.background,
                  color: variant.colour,
                }}
              >
                <img
                  src={variant.src}
                  width={logo.width}
                  height={logo.height}
                  alt={`MN logo in ${variant.name.toLowerCase()}`}
                />
              </figure>
              <strong>{variant.name}</strong>
              <p>{variant.use}</p>
              <a
                href={variant.src}
                download={`mn-logo-${variant.name.toLowerCase()}.webp`}
              >
                Download {variant.name.toLowerCase()} logo
              </a>
            </Stack>
          </Panel>
        ))}
      </Columns>
      <Panel>
        <Stack gap="md">
          <strong>Clear space at the minimum digital size</strong>
          <figure
            className="brand-clear-space"
            style={
              {
                "--brand-logo-height": `${logo.minimumHeight}px`,
                backgroundColor: palette.paper,
              } as CSSProperties
            }
          >
            <img
              src={navyLogo}
              width={logo.width}
              height={logo.height}
              alt="MN logo with clear space on every side"
            />
          </figure>
          <p>
            The mark is {logo.minimumHeight} CSS pixels high. The surrounding
            space is one mark height on each side. Keep text and other artwork
            outside that space.
          </p>
          <p>
            Preserve the {logo.width}:{logo.height} aspect ratio. Do not
            stretch, rotate or add a shadow to the asset.
          </p>
        </Stack>
      </Panel>
    </Stack>
  );
}

export function TypographySpecimens() {
  const initialTitle = "Making a long request easier to understand";
  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [message, setMessage] = useState("");
  return (
    <Stack gap="xl" className="brand-specimens" data-brand="consulting">
      <Panel>
        <Stack gap="md">
          <p>Display · Bricolage Grotesque</p>
          <h2 className="brand-type-display">A workshop with room to think</h2>
          <p className="brand-type-heading">
            Choose a small question to work through together
          </p>
          <p>Body · Atkinson Hyperlegible</p>
          <p>
            Bring one example from your day-to-day work. Describe who uses it,
            what they need to do and where they get stuck. The session ends with
            a small change you can try and a way to check whether it helped.
          </p>
          <p>
            <strong>
              Use emphasis for the part someone needs to find again.
            </strong>
          </p>
          <p>
            <em>
              A note or aside can use italics without introducing another
              family.
            </em>
          </p>
          <p className="brand-type-characters">
            I l 1 · O 0 · rn m · Ä Ö Ü ß · 0123456789
          </p>
        </Stack>
      </Panel>
      <Panel>
        <Stack gap="md">
          <strong>Interface · the shared sans stack</strong>
          <TextField
            label="Workshop title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setMessage("");
            }}
            hint="Controls keep their interface font when the surrounding prose changes brand."
          />
          <Cluster>
            <Button
              onClick={() => {
                setSavedTitle(title);
                setMessage("Title saved in this example.");
              }}
            >
              Save title
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTitle(savedTitle);
                setMessage("Changes discarded.");
              }}
            >
              Cancel
            </Button>
          </Cluster>
          <p role="status">{message}</p>
        </Stack>
      </Panel>
      <Table caption="Typography roles">
        <thead>
          <tr>
            <th scope="col">Use</th>
            <th scope="col">Family role</th>
            <th scope="col">Size role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Page title</th>
            <td>
              <code>--uix-font-display</code>
            </td>
            <td>
              <code>--uix-text-display</code>
            </td>
          </tr>
          <tr>
            <th scope="row">Section heading</th>
            <td>
              <code>--uix-font-display</code>
            </td>
            <td>
              <code>--uix-text-heading</code>
            </td>
          </tr>
          <tr>
            <th scope="row">Reading text</th>
            <td>
              <code>--uix-font-body</code>
            </td>
            <td>
              <code>--uix-text-body</code>
            </td>
          </tr>
          <tr>
            <th scope="row">Controls</th>
            <td>
              <code>--uix-font-ui</code>
            </td>
            <td>
              <code>--uix-text-ui</code>
            </td>
          </tr>
        </tbody>
      </Table>
    </Stack>
  );
}

export const colourPairs = [
  {
    name: "Identity text",
    foreground: palette.navy,
    background: palette.paper,
  },
  {
    name: "Decorative red on paper",
    foreground: palette.red,
    background: palette.paper,
  },
  {
    name: "Text red on paper",
    foreground: palette.redText,
    background: palette.paper,
  },
  {
    name: "Red on dark",
    foreground: palette.redOnDark,
    background: palette.navy,
  },
  {
    name: "Labs accent on light page",
    foreground: labs.accent.light,
    background: labs.page.light,
  },
  {
    name: "Labs accent on dark page",
    foreground: labs.accent.dark,
    background: labs.page.dark,
  },
] as const;

export function ColourSpecimens() {
  return (
    <Stack gap="xl" className="brand-specimens">
      <Columns min="sm">
        {Object.entries(palette).map(([name, value]) => (
          <Panel key={name}>
            <Stack gap="sm">
              <span
                className="brand-colour-swatch"
                style={{ backgroundColor: value }}
                aria-hidden="true"
              />
              <strong>{name}</strong>
              <code>{value}</code>
            </Stack>
          </Panel>
        ))}
      </Columns>
      <Table caption="Contrast of specific foreground and background pairs">
        <thead>
          <tr>
            <th scope="col">Pair</th>
            <th scope="col">Foreground / background</th>
            <th scope="col">Ratio</th>
            <th scope="col">Normal text threshold</th>
          </tr>
        </thead>
        <tbody>
          {colourPairs.map(({ name, foreground, background }) => {
            const ratio = contrastRatio(foreground, background);
            return (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>
                  <code>
                    {foreground} / {background}
                  </code>
                </td>
                <td>{ratio.toFixed(2)}:1</td>
                <td>{ratio >= 4.5 ? "Meets 4.5:1" : "Below 4.5:1"}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <p>
        Ratios use the package's opaque sRGB colours. The threshold shown is for
        normal-size text. A passing pair does not assess focus, state,
        transparency, imagery or an entire page.
      </p>
    </Stack>
  );
}
