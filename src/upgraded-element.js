import { create, update, render } from "omdomdom"
import { getScheduler } from "./scheduler"
import { upgradeProperty } from "./properties"
import * as internal from "./internal"
import * as external from "./external"
import {
  isEmptyObject,
  isString,
  isFunction,
  getTypeTag,
  toKebabCase,
  createUUID,
} from "./utilities"

/**
 * @module UpgradedElement
 * @extends HTMLElement
 */
export class UpgradedElement extends HTMLElement {
  constructor() {
    super()
    this[internal.initialize]()
  }

  // Retrieve defined properties from the extender.
  static get observedAttributes() {
    if (isEmptyObject(this.properties)) return []

    let attributes = []

    for (let propName in this.properties) {
      if (!this.properties[propName].reflected) continue
      attributes.push(toKebabCase(propName))
    }

    return attributes
  }

  // Keep adoptedCallback around in case it becomes useful later.
  // Consumers will need to call super() to remain compatible, in the mean time.
  adoptedCallback() {
      this[internal.isDisconnected] = false
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[internal.runLifecycle](
        external.elementAttributeChanged,
        name,
        oldValue,
        newValue
      )
    }
  }

  connectedCallback() {
    // If we were previously disconnected, then we shouldn't
    // run this lifecycle. connectedCallback has a habit of
    // being called despite the element being removed
    // from the DOM.
    if (this.isConnected && !this[internal.isDisconnected]) {
      this[internal.runLifecycle](external.elementDidConnect)
      this[internal.renderStyles]()
      this[external.requestRender]()
    }
  }

  disconnectedCallback() {
    this[internal.runLifecycle](external.elementWillUnmount)

    // Clean up detached nodes and data.
    this[internal.vDOM] = null

    // We need to track this so `connectedCallback` isn't
    // triggered again.
    this[internal.isDisconnected] = true
  }

  // Public

  /**
   * Returns the internal element id.
   * @returns {string}
   */
  get [external.elementIdProperty]() {
    return this[internal.elementId]
  }

  /**
   * Requests a new render at the next animation frame.
   * Will batch subsequent renders if they are requested
   * before the previous frame has completed (0-16/17 milliseconds)
   */
  [external.requestRender]() {
    this[internal.schedule](this[internal.renderDOM])
  }

  /**
   * Validates a property's value.
   * @param {string} propName
   * @param {string} value
   * @param {string} type
   */
  [external.validateType](propName, value, type) {
    const evaluatedType = getTypeTag(value)
    if (type === undefined || evaluatedType === type) return

    // eslint-disable-next-line no-console
    console.warn(
      `[UpgradedElement]: Property '${propName}' is invalid type of '${evaluatedType}'. Expected '${type}'. Check ${this.constructor.name}.`
    )
  }

  // Private

  /**
   * Triggers a lifecycle method of the specified `name` with `args`, if given.
   * @param {string} name - name of the lifecycle method
   * @param {arguments} args - args to pass along to the method, if any
   */
  [internal.runLifecycle](name, ...args) {
    if (isFunction(this[name])) {
      this[name](...args)
    }
  }

  /**
   * Do initial setup work, then upgrade.
   */
  [internal.initialize]() {
    // Append scheduler to the window
    this[internal.schedule] = getScheduler()

    // Internal properties and metadata
    this[internal.renderDOM] = this[internal.renderDOM].bind(this)
    this[internal.isFirstRender] = true
    this[internal.isDisconnected] = false
    this[internal.vDOM] = []
    this[internal.shadowRoot] = this.attachShadow({ mode: "open" })
    this[internal.elementId] = createUUID()

    // Set id as an attribute
    this.setAttribute(
      external.elementIdAttribute,
      this[external.elementIdProperty]
    )

    // Set document direction for reflow support in shadow roots
    this.setAttribute("dir", String(document.dir || "ltr"))

    this[internal.performUpgrade]()
  }

  /**
   * Upgrade properties detected in the extender.
   */
  [internal.performUpgrade]() {
    const { properties } = this.constructor

    if (isEmptyObject(properties)) return

    for (let propName in properties) {
      upgradeProperty(this, propName, properties[propName])
    }
  }

  /**
   * Retrieves the dom string from the extender.
   * @returns {string} - Stringified HTML from the extender's render method.
   */
  [internal.getDOMString]() {
    let domString

    if (isFunction(this.render)) {
      domString = this.render()
    } else {
      throw new Error(
        `You must include a render method in element: '${this.constructor.name}'`
      )
    }

    if (!isString(domString)) {
      throw new Error(
        `You attempted to render a non-string template in element: '${this.constructor.name}'.`
      )
    }

    return domString
  }

  [internal.getVDOM]() {
    return create(this[internal.getDOMString]())
  }

  /**
   * Creates the style tag and appends styles as detected in the extender.
   */
  [internal.renderStyles]() {
    if (!isString(this.constructor.styles)) return

    const { styles } = this.constructor
    const styleTag = document.createElement("style")
    styleTag.type = "text/css"
    styleTag.textContent = styles
    this[internal.shadowRoot].appendChild(styleTag)
  }

  /**
   * For first render:
   * Create a virtual DOM from the external `render` method and patch
   * it into the shadow root. Triggers `elementDidMount`, if defined.
   */
  [internal.getInitialRenderState]() {
    this[internal.vDOM] = this[internal.getVDOM]()
    render(this[internal.vDOM], this[internal.shadowRoot])
    this[internal.runLifecycle](external.elementDidMount)
    this[internal.isFirstRender] = false
  }

  /**
   * All renders after initial render:
   * Create a new vdom and update the existing one.
   */
  [internal.getNextRenderState]() {
    let nextVDOM = this[internal.getVDOM]()
    update(nextVDOM, this[internal.vDOM])
    nextVDOM = null
    this[internal.runLifecycle](external.elementDidUpdate)
  }

  /**
   * Runs either a new render or diffs the existing virtual DOM to a new one.
   */
  [internal.renderDOM]() {
    if (this[internal.isFirstRender]) {
      return this[internal.getInitialRenderState]()
    }

    this[internal.getNextRenderState]()
  }
}
