export const DOMInjector = {
  createWidget(content, className = '') {
    const widget = document.createElement('div');
    widget.className = `magical-widget ${className}`;
    widget.innerHTML = content;
    return widget;
  },

  injectAfter(newElement, referenceElement) {
    if (!referenceElement || !referenceElement.parentNode) {
      return false;
    }
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    return true;
  },

  injectBefore(newElement, referenceElement) {
    if (!referenceElement || !referenceElement.parentNode) {
      return false;
    }
    referenceElement.parentNode.insertBefore(newElement, referenceElement);
    return true;
  },

  injectAtTop(newElement, parentElement) {
    if (!parentElement) {
      return false;
    }
    if (parentElement.firstChild) {
      parentElement.insertBefore(newElement, parentElement.firstChild);
    } else {
      parentElement.appendChild(newElement);
    }
    return true;
  },

  injectAtBottom(newElement, parentElement) {
    if (!parentElement) {
      return false;
    }
    parentElement.appendChild(newElement);
    return true;
  },

  removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      return true;
    }
    return false;
  },

  addStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }
};
