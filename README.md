# Scroll.js

Scroll.js is a JavaScript package that enables parallax scrolling effect on selected elements.
With optimizations to Reduce **Jank**.

## Supported Effects

The following are supported effects

* Translate (Y, X)
* Rotate
* Scale
* Opacity
* Add custom class

## Examples

[Example](https://baianat.github.io/scroll.js/)

## Getting Started

### Install

First step is to install it using yarn or npm

```bash
npm install @baianat/veer

# or use yarn
yarn add @baianat/veer
```

### Include necessary files

``` html
<body>
  ...
  <script type="text/javascript" src="dist/js/scroll.js"></script>
</body>
```

### Usage

You create new `Scroll` object and pass array of elements, that you want to add effect to it.

``` javascript
  const scroller = new Scroll(
    [{
      // Item 1 option
    }, {
      // Item 2 option
    }]
  );
```

### Items Options

```js
{
  // Element css selector or DOM element
  element: '#square1',
  // Translate object values
  translate: {
    // translate unit, it can be 'px' or '%', defaults is 'px'
    unit: '%'
    // Y offsets, first value is the starting position, second is the ending position in px
    y: [-200, 200],
    // X offsets, first value is the starting position, second is the ending position in px
    x: [0, 10]
  },
  // Rotate values, first value is the starting degree, second is the ending degree
  // Accepts value between -360 : 360.
  rotate: [-45, 45],
  // Scale values, first value is the starting scale, second is the ending scale
  // Accepts fraction values.
  scale: [0.5, 1.4],
  // Opacity values, first value is the starting opacity, second is the ending opacity
  // Accepts value between 0 : 1, fractions are allowed
  opacity: [0, 1],
  // A class to be added when the element is in the viewport
  class: 'is-active'
}
```

## Browser Support

This package is using [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to check if the element in the viewport, since it's not [supported](https://caniuse.com/#search=IntersectionObserver) in all browsers you will need to add a [polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill) to use it.
