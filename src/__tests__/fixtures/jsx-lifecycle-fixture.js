import { jsx } from "snabbdom"
import { RotomElement, register } from "../../rotom.jsx"

/**
 * Create a test fixture with custom accessors. The id must be unique as we
 * can't unregister custom elements from the DOM, even between tests.
 * @param {string} id
 */
export function createJsxLifecycleFixture(id, wait = false) {
  class TestElement extends RotomElement {
    constructor() {
      super()
    }

    static get properties() {
      return {
        testProp: {
          type: "boolean",
          default: false,
          reflected: true,
        },
      }
    }

    render() {
      return <div>default content</div>
    }
  }

  const mount = () => {
    register(`test-${id}`, TestElement)
    document.body.innerHTML = `<test-${id}></test-${id}>`
  }

  if (wait) {
    return [mount, TestElement]
  } else {
    mount()
    return TestElement
  }
}
