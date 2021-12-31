import { Rotom, register } from "../../../src/rotom.template"
// const { Rotom, register } = window.rotom

class CustomAccessorTest extends Rotom {
  static get properties() {
    return {
      text: {
        type: "string",
      },
      preventUpdates: {
        type: "boolean",
        default: false,
      },
    }
  }

  set text(value) {
    this._text = value
    this.requestRender()
  }

  get text() {
    return this._text
  }

  constructor() {
    super()
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleCancel = this.handleCancel.bind(this)
  }

  onMount() {
    this.text = "Cool"
    this.button = this.shadowRoot.querySelector("#update")
    this.button.addEventListener("click", this.handleUpdate)
    this.cancelButton = this.shadowRoot.querySelector("#cancel-updates")
    this.cancelButton.addEventListener("click", this.handleCancel)
  }

  onUnmount() {
    this.button.removeEventListener("click", this.handleUpdate)
    this.cancelButton.removeEventListener("click", this.handleCancel)
  }

  handleUpdate() {
    if (this.preventUpdates) return
    this.text = this.text === "Cool" ? "Not Cool" : "Cool"
  }

  handleCancel() {
    this.preventUpdates = true
  }

  render() {
    return `
      <div>
        <p>Update text with custom accessors:</p>
        <button id="update">This is:&nbsp;${
          this.text || "(uh oh, no text)"
        }</button>
        <p>Stop updates from happening:</p>
        <button id="cancel-updates">Disable updates</button>
      </div>
    `
  }
}

register("custom-accessor-test", CustomAccessorTest)
