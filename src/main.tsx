// ===== FILE: src/main.tsx =====
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css"; // hvis du har en global css, ellers slet denne linje

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
