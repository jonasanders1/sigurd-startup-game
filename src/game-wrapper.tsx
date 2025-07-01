import ReactDOM from "react-dom/client";
import MainGame from "./components/MainGame"; // your root game component
import "./index.css";
import css from './index.css?inline';
import { getVersion, logVersion } from "./version";

class GameElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const rootElement = document.createElement("div");
    shadow.appendChild(rootElement);
    
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);

    this.root = ReactDOM.createRoot(rootElement);
    this.root.render(<MainGame />);

    // Log version info
    logVersion();

    // Expose version to external sites
    this.setAttribute('data-version', getVersion().version);
    this.setAttribute('data-build', getVersion().build.toString());
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

// Define the custom element
customElements.define("sigurd-startup", GameElement);

// Add methods to the prototype to ensure they're not tree-shaken
(GameElement.prototype as any).getVersion = function() {
  return getVersion();
};

(GameElement.prototype as any).isCompatible = function(minVersion: string) {
  const current = getVersion();
  const [major, minor, patch] = current.version.split('.').map(Number);
  const [minMajor, minMinor, minPatch] = minVersion.split('.').map(Number);
  
  if (major > minMajor) return true;
  if (major < minMajor) return false;
  if (minor > minMinor) return true;
  if (minor < minMinor) return false;
  return patch >= minPatch;
};

// Export version for direct import
export { getVersion, logVersion };
