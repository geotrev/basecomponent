import { UpgradedElement, register } from "../../src/upgraded-element"
import "./reflect-properties-test"

class NestedElementTest extends UpgradedElement {
  static get properties() {
    return {
      borderColor: {
        default: "lightgray",
        type: "string",
      },
    }
  }

  static get styles() {
    return `
      :host {
        display: block;
      }

      .border {
        border-width: 1px;
        border-style: solid;
      }
    `
  }

  constructor() {
    super()
    this.handleClick = this.handleClick.bind(this)
  }

  elementDidMount() {
    this.label = this.shadowRoot.querySelector("#clicker")
    this.label.addEventListener("click", this.handleClick)
  }

  elementWillUnmount() {
    this.label.removeEventListener("click", this.handleClick)
  }

  handleClick() {
    this.borderColor = ["gray", "blue", "purple", "lime", "orange"][Math.floor(Math.random() * 5)]
    this.shadowRoot.querySelector("reflect-properties-test").firstName = [
      "Mario",
      "Samus",
      "Luigi",
      "C Falcon",
    ][Math.floor(Math.random() * 4)]
  }

  render() {
    return `
      <p>This one is nested.</p>
      <button id="clicker">Click to update</button>
      <div class="border" style="border-color: ${this.borderColor}">
        <reflect-properties-test first-name="Chaos" description="I'm nested!">
          <slot></slot>
        </reflect-properties-test>
      </div>
    `
  }
}

register("nested-element-test", NestedElementTest)