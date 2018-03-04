(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Flux = factory());
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

var Flux = function Flux(elmData, ref) {
  if ( elmData === void 0 ) elmData = [];
  var breakpoint = ref.breakpoint; if ( breakpoint === void 0 ) breakpoint = 0;

  this.elementsData = elmData;
  this.settings = {
    breakpoint: breakpoint
  };
  this._init();
};

Flux.prototype.addElement = function addElement (elmData) {
    var this$1 = this;

  this.elementsData.push(elmData);
  this._initElements();
  setTimeout(function () { return this$1.update(); }, 500);
};

Flux.prototype._init = function _init () {
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

Flux.prototype._initElements = function _initElements () {
    var this$1 = this;

  this.mediaQuery = window.matchMedia(("(min-width: " + (this.settings.breakpoint) + "px)"));
  this.elements = [];
  this.elementsData.forEach(function (data) {
    var elm = select(data.element);
    data.element = elm;

    if (!data.omit) {
      data.rect = elm.getBoundingClientRect();
      this$1.addMissingTransformation(data);
      this$1.generateFixedData(data);
      elm.style.opacity = data.opacity[0];
      elm.style.transform = "\n          translate3d(\n            " + (data.translate.x[0]) + (data.translate.unit) + ",\n            " + (data.translate.y[0]) + (data.translate.unit) + ",\n            0\n          )\n          rotate(" + (data.rotate[0]) + "deg)\n          scale(" + (data.scale[0]) + ")";
    }

    this$1.observer.observe(elm);
    this$1.elements.push(data.element);
  });
};

Flux.prototype._initObserver = function _initObserver () {
  // eslint-disable-next-line
  this.observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.intersectionRatio > 0) {
        entry.target.dataset.fluxInViewport = 'true';
        return;
      }
      entry.target.dataset.fluxInViewport = '';
    });
  }, { threshold: [0, 0.25, 0.75, 1] });
};

Flux.prototype._initEvents = function _initEvents () {
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
    this$1.elementsData.forEach(function (data) {
      if (!data.omit) {
        data.rect = data.element.getBoundingClientRect();
        this$1.generateFixedData(data);
      }
    });
    this$1.update();
  }, 100));
};

Flux.prototype.update = function update () {
    var this$1 = this;

  this.elements.forEach(function (el, index) {
    var elData = this$1.elementsData[index];
    if (
      !el.dataset.fluxInViewport &&
      elData.class &&
      Object.values(elData.class)[0] === 'toggle'
    ) {
      el.classList.remove(Object.keys(elData.class)[0]);
      return;
    }

    if (!el.dataset.fluxInViewport) {
      return;
    }

    if (elData.class) {
      var className = typeof elData.class === 'string' ? elData.class : Object.keys(elData.class)[0];
      el.classList.add(className);
    }

    if (!this$1.mediaQuery.matches) {
      elData.element.style.transform = '';
      elData.element.style.opacity = '';
      return;
    }

    if (!elData.omit) {
      this$1.transform = this$1.getTransform(elData);
      el.style.transform = "\n          translate3d(\n            " + (this$1.transform.x) + (elData.translate.unit) + ",\n            " + (this$1.transform.y) + (elData.translate.unit) + ",\n            0\n          )\n          rotate(" + (this$1.transform.deg) + "deg)\n          scale(" + (this$1.transform.scale) + ")";
      el.style.opacity = this$1.transform.opacity;
    }
  });
};

Flux.prototype.getTransform = function getTransform (el) {
  var scroll = this.scrolled - el.position;
  var uPerS = el.unitPerScroll;

  var transform = {
    y: uPerS.y ? getInRange(el.translate.y[0] + scroll * uPerS.y, el.translate.y) : 0,
    x: uPerS.x ? getInRange(el.translate.x[0] + scroll * el.unitPerScroll.x, el.translate.x) : 0,
    deg: uPerS.deg ? getInRange(el.rotate[0] + scroll * el.unitPerScroll.deg, el.rotate) : 0,
    scale: uPerS.scale ? getInRange(el.scale[0] + scroll * el.unitPerScroll.scale, el.scale) : 1,
    opacity: uPerS.opacity ? getInRange(el.opacity[0] + scroll * el.unitPerScroll.opacity, el.opacity) : 1
  };
  return transform;
};

Flux.prototype.addMissingTransformation = function addMissingTransformation (el) {
  if (!el.translate) {
    el.translate = {};
  }
  if (!el.translate.x) {
    el.translate.x = [0, 0];
  }
  if (!el.translate.y) {
    el.translate.y = [0, 0];
  }
  if (!el.translate.unit) {
    el.translate.unit = 'px';
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

Flux.prototype.generateFixedData = function generateFixedData (elData) {
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
  var deltaTransformY = elData.translate.unit === 'px'
    ? deltaTransform.y
    : elData.element.parentNode.clientHeight * deltaTransform.y / 100;
  var denominator = this.viewport.height + deltaTransformY + sign * elData.rect.height;

  elData.position = this.scrolled + elData.rect.top - this.viewport.height;
  elData.unitPerScroll = {
    y: (Math.sign(elData.translate.y[1]) * deltaTransform.y) / denominator,
    x: (Math.sign(elData.translate.x[1]) * deltaTransform.x) / denominator,
    deg: (Math.sign(elData.rotate[1]) * deltaTransform.deg) / denominator,
    scale: ((elData.scale[0] > elData.scale[1] ? -1 : 1) * deltaTransform.scale) / denominator,
    opacity: ((elData.opacity[0] > elData.opacity[1] ? -1 : 1) * deltaTransform.opacity) / denominator
  };
};

return Flux;

})));
