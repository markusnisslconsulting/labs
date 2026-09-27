import type { Plugin } from "vite";
import { loadWorkbench, workbenchInputs } from "./workbench";

export function workbenchDirectory(): Plugin {
  const id = "virtual:labs-workbench";
  return {
    name: "labs-workbench-directory",
    resolveId(source) {
      return source === id ? `\0${id}` : undefined;
    },
    load(source) {
      if (source !== `\0${id}`) return;
      for (const path of workbenchInputs) this.addWatchFile(path);
      return `export const workbench = ${JSON.stringify(loadWorkbench())};`;
    },
    configureServer(server) {
      server.watcher.add(workbenchInputs);
      server.watcher.on("change", (path) => {
        if (!workbenchInputs.includes(path)) return;
        const module = server.moduleGraph.getModuleById(`\0${id}`);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
