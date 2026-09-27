import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

// The design tokens and demo surfaces live with the components they
// style; the shell adds layout on top.
import "@labs/ui/styles.css";
import "@labs/brand/labs.css";
import "./styles.css";

// Load the layer-order declaration before App imports component CSS.
// The first layer encountered fixes its position in the dev browser.
import App from "./App";
import { SiteStringsProvider } from "./i18n/SiteStrings";

const root = document.getElementById("root")!;
const application = (
  <StrictMode>
    <BrowserRouter>
      <SiteStringsProvider>
        <App />
      </SiteStringsProvider>
    </BrowserRouter>
  </StrictMode>
);
if (root.hasChildNodes() && root.querySelector(".site-shell"))
  hydrateRoot(root, application);
else createRoot(root).render(application);
