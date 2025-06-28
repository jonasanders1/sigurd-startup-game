import ReactDOM from "react-dom/client";
import MainGame from "./components/MainGame"; // your root game component
import "./index.css";
import css from './index.css?inline';

class GameElement extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const root = document.createElement("div");
    shadow.appendChild(root);
    
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);

    ReactDOM.createRoot(root).render(<MainGame />);
  }
}

customElements.define("sigurd-startup", GameElement);
