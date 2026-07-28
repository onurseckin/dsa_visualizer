import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import "./styles/index.css";
import { initSqliteSync } from "./app/sqliteSync";
import { registerPythonRunnerProbe } from "./playground/runtimeProbe";

void initSqliteSync();
registerPythonRunnerProbe(window);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
