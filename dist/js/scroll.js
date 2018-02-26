(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Scroll = factory());
}(this, (function () { 'use strict';

/**
 * Utilities
 */
function select(element) {
  if (typeof element === 'string') {
    return document.querySelector(element);
  }
  return element;
}









function throttle(func, limit) {
  var arguments$1 = arguments;
  if ( limit === void 0 ) limit = 16;

  var wait = false;
  return function () {
    if (!wait) {
      func.apply(void 0, arguments$1);
      wait = true;
      setTimeout(function () {
        wait = false;
      }, limit);
    }
  };
}

function getInRange(value, boundaries) {
  var max = boundaries[0] > boundaries[1] ? boundaries[0] : boundaries[1];
  var min = boundaries[0] < boundaries[1] ? boundaries[0] : boundaries[1];

  return Math.max(Math.min(value, max), min);
}

var Scroll = function Scroll(elmData) {
  if ( elmData === void 0 ) elmData = [];

  this.elementsData = elmData;
  this._init();
};

Scroll.prototype.addElement = function addElement (elmData) {
    var this$1 = this;

  this.elementsData.push(elmData);
  this._initElements();
  setTimeout(function () { return this$1.update(); }, 500);
};

Scroll.prototype._init = function _init () {
    var this$1 = this;

  this.scrolled = window.scrollY;
  this.viewport = {
    height: window.innerHeight,
    width: window.innerWidth
  };

  this._initObserver();
  this._initElements();
  this._initEvents();
  setTimeout(function () { return this$1.update(); }, 500);
};

Scroll.prototype._initElements = function _initElements () {
    var this$1 = this;

  this.elements = this.elementsData.map(function (data) { return select(data.element); });

  // eslint-disable-next-line
  this.elements.forEach(function (el, index) {
    this$1.addMissingTransformation(this$1.elementsData[index]);
    el.style.transform = "\n      translate3d(\n        " + (this$1.elementsData[index].translate.x[0]) + "px,\n        " + (this$1.elementsData[index].translate.y[0]) + "px, 0\n      )\n      rotate(" + (this$1.elementsData[index].rotate[0]) + "deg)\n      scale(" + (this$1.elementsData[index].scale[0]) + ")";
    el.style.opacity = this$1.elementsData[index].opacity[0];

    this$1.generateFixedData(this$1.elementsData[index], el);
    this$1.observer.observe(el);
  });
};

Scroll.prototype._initObserver = function _initObserver () {
  // eslint-disable-next-line
  this.observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.intersectionRatio > 0) {
        entry.target.classList.add('is-inViewPort');
        return;
      }
      entry.target.classList.remove('is-inViewPort');
    });
  }, { threshold: [0, 0.25, 0.75, 1] });
};

Scroll.prototype._initEvents = function _initEvents () {
    var this$1 = this;

  this.scrolling = false;
  window.addEventListener('scroll', function () {
    this$1.scrolled = window.scrollY;
    if (!this$1.scrolling) {
      window.requestAnimationFrame(function () {
        this$1.update();
        this$1.scrolling = false;
      });

      this$1.scrolling = true;
    }
  });

  window.addEventListener('resize', throttle(function () {
    this$1.viewport = {
      height: window.innerHeight,
      width: window.innerWidth
    };
    this$1.scrolled = window.scrollY;
    this$1.update();
  }, 100));
};

Scroll.prototype.update = function update () {
    var this$1 = this;

  this.elements.forEach(function (el, index) {
    if (!el.classList.contains('is-inViewPort')) {
      el.classList.remove(this$1.elementsData[index].class);
      return;
    }
    var elData = this$1.elementsData[index];
    if (elData.class) { el.classList.add('is-active'); }
    this$1.transform = this$1.getTransform(elData);
    el.style.transform = "\n        translate3d(" + (this$1.transform.x) + "px, " + (this$1.transform.y) + "px, 0)\n        rotate(" + (this$1.transform.deg) + "deg)\n        scale(" + (this$1.transform.scale) + ")";
    el.style.opacity = this$1.transform.opacity;
  });
};

Scroll.prototype.getTransform = function getTransform (el) {
  var ratio = this.scrolled - el.position;

  return {
    y: getInRange(el.translate.y[0] + Math.sign(el.translate.y[1]) * ratio * el.unitPerScroll.y, el.translate.y),
    x: getInRange(el.translate.x[0] + Math.sign(el.translate.x[1]) * ratio * el.unitPerScroll.x, el.translate.x),
    deg: getInRange(el.rotate[0] + Math.sign(el.rotate[1]) * ratio * el.unitPerScroll.deg, el.rotate),
    scale: getInRange(el.scale[0] + (el.scale[0] > el.scale[1] ? -1 : 1) * ratio * el.unitPerScroll.scale, el.scale),
    opacity: getInRange(el.opacity[0] + (el.opacity[0] > el.opacity[1] ? -1 : 1) * ratio * el.unitPerScroll.opacity, el.opacity)
  }
};

Scroll.prototype.addMissingTransformation = function addMissingTransformation (el) {
  if (!el.translate) {
    el.translate = {};
  }
  if (!el.translate.x) {
    el.translate.x = [0, 0];
  }
  if (!el.translate.y) {
    el.translate.y = [0, 0];
  }
  if (!el.rotate) {
    el.rotate = [0, 0];
  }
  if (!el.opacity) {
    el.opacity = [1, 1];
  }
  if (!el.scale) {
    el.scale = [1, 1];
  }
};

Scroll.prototype.generateFixedData = function generateFixedData (elData, el) {
  var rect = el.getBoundingClientRect();
  var deltaTransform = {
    y: Math.abs(elData.translate.y[1] - elData.translate.y[0]),
    x: Math.abs(elData.translate.x[1] - elData.translate.x[0]),
    deg: Math.abs(elData.rotate[1] - elData.rotate[0]),
    scale: Math.abs(elData.scale[1] - elData.scale[0]),
    opacity: Math.abs(elData.opacity[1] - elData.opacity[0])
  };
  var sign = deltaTransform.y === 0 || elData.translate.y[1] === 0
    ? 1
    : Math.sign(elData.translate.y[1]);
  var denominator = this.viewport.height + deltaTransform.y + sign * rect.height;

  elData.rect = rect;
  elData.position = this.scrolled + rect.top - this.viewport.height;
  elData.unitPerScroll = {
    y: deltaTransform.y / denominator,
    x: deltaTransform.x / denominator,
    deg: deltaTransform.deg / denominator,
    scale: deltaTransform.scale / denominator,
    opacity: deltaTransform.opacity / denominator
  };
};

return Scroll;

})));
