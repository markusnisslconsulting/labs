import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

// The design tokens and demo surfaces live with the components they
// style; the shell adds layout on top.
import "@labs/ui/styles.css";
import "./styles.css";

// Load the layer-order declaration before App imports component CSS.
// The first layer encountered fixes its position in the dev browser.
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
