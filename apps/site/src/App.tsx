import { Route, Routes } from "react-router";
import { CatalogPage } from "./pages/CatalogPage";
import { LabPage } from "./pages/LabPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SiteShell } from "./shell/SiteShell";
import { RouteRecovery } from "./recovery/RouteRecovery";
import { ReferencePage } from "./pages/ReferencePage";

export default function App() {
  return (
    <SiteShell>
      <RouteRecovery>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/demos" element={<CatalogPage directory="demos" />} />
          <Route
            path="/patterns"
            element={<CatalogPage directory="patterns" />}
          />
          <Route
            path="/components"
            element={<ReferencePage kind="components" />}
          />
          <Route
            path="/foundations"
            element={<ReferencePage kind="foundations" />}
          />
          <Route path="/:slug" element={<LabPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </RouteRecovery>
    </SiteShell>
  );
}
