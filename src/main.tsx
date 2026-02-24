import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { ThemeProvider } from "./theme/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);
