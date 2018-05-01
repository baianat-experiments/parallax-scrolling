/**
 * Utilities
 */
export function select (element) {
  if (typeof element === 'string') {
    return document.querySelector(element);
  }
  return element;
}
export function css (element, styles) {
  Object.keys(styles).forEach((key) => {
    element.style[key] = styles[key];
  });
}
export function sync (callback) {
  setTimeout(() => callback(), 1000 / 60);
}

export function callable (func) {
  if (typeof func === 'function') {
    func();
  }
}

export function getAverage (array, length) {
  let sum = 0;
  const elements = array.slice(Math.max(array.length - length, 1));
  elements.forEach((value) => {
    sum = sum + value;
  });
  return Math.ceil(sum / length);
}

export function getArray (length, value) {
  return new Array(length).fill(value);
}

export function throttle (func, limit = 16) {
  let wait = false;
  return () => {
    if (!wait) {
      func(...arguments);
      wait = true;
      setTimeout(() => {
        wait = false;
      }, limit);
    }
  };
}

export function getInRange (value, [start, end]) {
  const max = start > end ? start : end;
  const min = start < end ? start : end;

  return Math.max(Math.min(value, max), min);
}
