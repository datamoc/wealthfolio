import React from "react";
import * as ReactDOMLegacy from "react-dom";
import ReactDOM from "react-dom/client";
import i18next from "i18next";
import * as ReactI18next from "react-i18next";
import { debugAddonState, loadAllAddons } from "./addons/addons-loader";
import "./addons/addons-runtime-context";
import App from "./App";
import { installLockdown } from "./lockdown";
import "./styles.css";
import "./lib/i18n";
import "./lib/i18n-types";

// Initialize development mode only in development
if (import.meta.env.DEV) {
  import("./addons/addons-dev-mode");
} else {
  installLockdown();
}

// Expose React and ReactDOM globally for addons
// ReactDOM/client only has createRoot/hydrateRoot, but addons need createPortal from react-dom
window.React = React;
window.ReactDOM = ReactDOMLegacy;
window.i18next = i18next;
window.ReactI18next = ReactI18next;

// Make debug function available globally for debugging
globalThis.debugAddons = debugAddonState;

// Load addons after context is injected
loadAllAddons();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
