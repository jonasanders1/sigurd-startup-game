import ReactDOM from "react-dom/client";
import MainGame from "./components/MainGame"; // your root game component
import "./index.css";
import css from './index.css?inline';

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
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

customElements.define("sigurd-startup", GameElement);
