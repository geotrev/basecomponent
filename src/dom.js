export const stringToHTML = domString => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(domString, "text/html")
  return doc.body
}

const getAttributes = attributes => {
  return Array.prototype.map.call(attributes, attribute => ({
    name: attribute.name,
    value: attribute.value,
  }))
}

export const createDOMMap = (element, isSVG) => {
  return Array.prototype.map.call(element.childNodes, node => {
    const type =
      node.nodeType === 3 ? "text" : node.nodeType === 8 ? "comment" : node.tagName.toLowerCase()
    const attributes = node.nodeType === 1 ? getAttributes(node.attributes) : []
    const content = node.childNodes && node.childNodes.length > 0 ? null : node.textContent
    const details = { node, content, attributes, type }

    details.isSVG = isSVG || details.type === "svg"
    details.children = createDOMMap(node, details.isSVG)
    return details
  })
}

const getStyleMap = styles => {
  return styles.split(";").reduce((map, style) => {
    const entry = style.trim()

    if (entry.indexOf(":") > 0) {
      const [name, value] = entry.split(":")

      map.push({
        name: name ? name.trim() : "",
        value: value ? value.trim() : "",
      })
    }

    return map
  }, [])
}

const removeStyles = (element, styles) => {
  styles.forEach(style => (element.style[style.name] = ""))
}

const changeStyles = (element, styles) => {
  styles.forEach(style => (element.style[style.name] = style.value))
}

const diffStyles = (element, styles) => {
  // Get style map
  const styleMap = getStyleMap(styles)

  // Get styles to remove
  const remove = Array.prototype.filter.call(element.style, style => {
    const findStyle = styleMap.find(newStyle => {
      return newStyle.name === style && newStyle.value === element.style[style]
    })
    return findStyle === undefined
  })

  // Apply changes
  removeStyles(element, remove)
  changeStyles(element, styleMap)
}

const removeAttributes = (element, attributes) => {
  attributes.forEach(attribute => {
    // If the attribute is `class` or `style`,
    // unset the properties.
    if (attribute.name === "class") {
      element.className = ""
    } else if (attribute.name === "style") {
      removeStyles(element, Array.prototype.slice.call(element.style))
    } else {
      element.removeAttribute(attribute.name)
    }
  })
}

const addAttributes = (element, attributes) => {
  attributes.forEach(attribute => {
    // If the attribute is `class` or `style`,
    // apply those as properties.
    if (attribute.name === "class") {
      element.className = attribute.value
    } else if (attribute.name === "style") {
      diffStyles(element, attribute.value)
    } else {
      // A null attribute is still be valid; fallback to `true`.
      element.setAttribute(attribute.name, attribute.value || true)
    }
  })
}

const createNode = element => {
  let node
  if (element.type === "text") {
    node = document.createTextNode(element.content)
  } else if (element.type === "comment") {
    node = document.createComment(element.content)
  } else if (element.isSVG) {
    node = document.createElementNS("http://www.w3.org/2000/svg", element.type)
  } else {
    node = document.createElement(element.type)
  }

  addAttributes(node, element.attributes)

  if (element.children.length > 0) {
    element.children.forEach(childElement => {
      node.appendChild(createNode(childElement))
    })
  } else if (element.type !== "text") {
    node.textContent = element.content
  }

  return node
}

const diffAttributes = (template, existing) => {
  const getRemovedAttributes = existing.attributes.filter(attribute => {
    const newAttributes = template.attributes.find(newAttribute => {
      return attribute.name === newAttribute.name
    })

    return newAttributes === undefined
  })

  const getChangingAttributes = template.attributes.filter(attribute => {
    const newAttributes = find(existing.attributes, existingAttribute => {
      return attribute.name === existingAttribute.name
    })

    return newAttributes === undefined || newAttributes.value !== attribute.value
  })

  addAttributes(existing.node, getChangingAttributes)
  removeAttributes(existing.node, getRemovedAttributes)
}

export const diffDOM = (templateMap, domMap, element) => {
  // Remove missing children from map
  let count = domMap.length - templateMap.length
  if (count > 0) {
    for (; count > 0; count--) {
      const child = domMap[domMap.length - count]
      child.node.parentNode.removeChild(child.node)
    }
  }

  templateMap.forEach((node, index) => {
    const existingChildNode = domMap[index]
    const templateChildNode = templateMap[index]

    // Starting at the top (node) level, check that if the template
    // node is different from the existing node.
    // 1. Node: Add new node
    // 2. Type: Replace node
    // 3. Attributes: Patch the node
    // 4. Content: Patch the node
    // 5 a) Children: Remove deleted node
    // 5 b) Children: Existing node has children the template does not, create them
    // 5 c) Children: Add new child node from the template

    // 1. Create or append any new children
    if (!existingChildNode) {
      return element.appendChild(createNode(templateChildNode))
    }

    // 2. If element is not the same type, replace it with the new element
    if (templateChildNode.type !== existingChildNode.type) {
      return existingChildNode.node.parentNode.replaceChild(
        createNode(templateChildNode),
        existingChildNode.node
      )
    }

    // 3. Attributes
    diffAttributes(templateChildNode, existingChildNode)

    // 4. Content
    if (templateChildNode.content !== existingChildNode.content) {
      return (existingChildNode.node.textContent = templateChildNode.content)
    }

    // 5a. Remove children
    if (existingChildNode.children.length > 0 && node.children.length < 1) {
      return (existingChildNode.node.innerHTML = "")
    }

    // 5b. If element is empty and shouldn't be, build it up
    //     This uses a document fragment to minimize reflows
    if (existingChildNode.children.length < 1 && node.children.length > 0) {
      const fragment = document.createDocumentFragment()
      diffDOM(node.children, existingChildNode.children, fragment)
      return element.appendChild(fragment)
    }

    // 5c. Add children recursively
    if (node.children.length > 0) {
      return diffDOM(node.children, existingChildNode.children, existingChildNode.node)
    }
  })
}

export const renderMapToDOM = (templateMap, root) => {
  templateMap.forEach(element => root.appendChild(element.node))
}
