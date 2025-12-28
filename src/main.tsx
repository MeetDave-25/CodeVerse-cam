import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

function showError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  rootEl.innerHTML = `<pre style="color: #f88; background:#111; padding:1rem; white-space:pre-wrap">Error: ${message}</pre>`;
}

try {
  createRoot(rootEl).render(<App />);
} catch (err) {
  console.error("Render error:", err);
  showError(err);
}

window.addEventListener("error", (e) => {
  console.error("Window error:", e);
  showError((e as ErrorEvent).error || (e as ErrorEvent).message || String(e));
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled rejection:", e);
  showError((e as PromiseRejectionEvent).reason || String(e));
});
