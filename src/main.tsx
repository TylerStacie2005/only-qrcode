import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.tsx";
import { initAds } from "./ads/adsService";

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

// The ad-free decision reads existing app data, so it must finish before anything writes.
initAds()
  .catch((e) => console.warn("[Ads] init failed:", e))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </StrictMode>,
    );
  });
