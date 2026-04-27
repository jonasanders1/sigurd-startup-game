import ReactDOM from "react-dom/client";
import MainGame from "./components/MainGame"; // your root game component
import "./index.css";
import css from "./index.css?inline";
import { getVersion, logVersion } from "./version";
import { debugAssetPaths } from "./config/assets";

// @font-face declarations applied inside a shadow root don't reliably register
// with the browser's font loader. Google Fonts links must live in document.head
// so the families resolve everywhere — including the shadow DOM where the game
// renders. Idempotent: marker attribute prevents duplicate injection if multiple
// instances mount.
const FONT_MARKER = "data-sigurd-fonts";
const ensureFontsLoaded = () => {
  if (typeof document === "undefined") return;
  if (document.head.querySelector(`link[${FONT_MARKER}]`)) return;
  const families = [
    "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap",
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
    "https://fonts.googleapis.com/css2?family=VT323&display=swap",
  ];
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  preconnect.setAttribute(FONT_MARKER, "");
  document.head.appendChild(preconnect);
  for (const href of families) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(FONT_MARKER, "");
    document.head.appendChild(link);
  }
};

interface GameElementInterface {
  getVersion: () => ReturnType<typeof getVersion>;
  isCompatible: (minVersion: string) => boolean;
}

class GameElement extends HTMLElement implements GameElementInterface {
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    // Debug asset paths
    debugAssetPaths();

    ensureFontsLoaded();

    const shadow = this.attachShadow({ mode: "open" });
    const rootElement = document.createElement("div");
    shadow.appendChild(rootElement);

    const style = document.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);

    this.root = ReactDOM.createRoot(rootElement);
    this.root.render(<MainGame />);

    // Log version info
    logVersion();

    // Expose version to external sites
    this.setAttribute("data-version", getVersion().version);
    this.setAttribute("data-build", getVersion().build.toString());
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  getVersion() {
    return getVersion();
  }

  isCompatible(minVersion: string) {
    const current = getVersion();
    const [major, minor, patch] = current.version.split(".").map(Number);
    const [minMajor, minMinor, minPatch] = minVersion.split(".").map(Number);

    if (major > minMajor) return true;
    if (major < minMajor) return false;
    if (minor > minMinor) return true;
    if (minor < minMinor) return false;
    return patch >= minPatch;
  }
}

// Define the custom element
customElements.define("sigurd-startup", GameElement);

// Export version for direct import
export { getVersion, logVersion };
