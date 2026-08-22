import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Labs UI · Markus Nissl",
    brandUrl: "https://labs.markusnissl.com",
    colorPrimary: "#e5173f",
    colorSecondary: "#172b4d",
    appBg: "#f0f3f8",
    appContentBg: "#ffffff",
    appBorderColor: "#d5dbe6",
    textColor: "#172b4d",
    textMutedColor: "#4b5870",
  }),
});
