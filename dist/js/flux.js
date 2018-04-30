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

function getInRange(value, ref) {
  var start = ref[0];
  var end = ref[1];

  var max = start > end ? start : end;
  var min = start < end ? start : end;

  return Math.max(Math.min(value, max), min);
}

function getAbsoluteValue(value, unit, elHeight) {
  return unit === 'px' ? value : value / 100 * elHeight;
}
function valuePerScroll(ref, denominator) {
  var start = ref[0];
  var end = ref[1];

  return (end - start) / denominator 
}

var Flux = function Flux(elmData, ref) {
  if ( elmData === void 0 ) elmData = [];
  if ( ref === void 0 ) ref = {};
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
  document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
      this$1._initObserver();
      this$1._initElements();
      this$1._initEvents();
      this$1.update(true);
    }
  };
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
    }

    this$1.observer.observe(elm);
    this$1.elements.push(data.element);
  });
};

Flux.prototype._initObserver = function _initObserver () {
  // eslint-disable-next-line
  this.observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.dataset.fluxInViewport = 'true';
        return;
      }
      entry.target.dataset.fluxInViewport = '';
    });
  });
};

Flux.prototype._initEvents = function _initEvents () {
    var this$1 = this;

  this.scrolling = false;

  // scroll optimization https://developer.mozilla.org/en-US/docs/Web/Events/scroll
  window.addEventListener('scroll', function () {
    this$1.scrolled = window.scrollY;
    if (!this$1.scrolling) {
      window.requestAnimationFrame(function () {
        this$1.update();
        this$1.scrolling = false;
      });
      this$1.scrolling = true;
    }
  }, {
    passive: true
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

Flux.prototype.update = function update (force) {
    var this$1 = this;
    if ( force === void 0 ) force = false;

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

    if (!el.dataset.fluxInViewport && !force) {
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
      el.style.transform = "\n          translateX(" + (this$1.transform.x) + (elData.translate.unit) + ")\n          translateY(" + (this$1.transform.y) + (elData.translate.unit) + ")\n          rotate(" + (this$1.transform.deg) + "deg)\n          scale(" + (this$1.transform.scale) + ")";
      el.style.opacity = this$1.transform.opacity;
    }
  });
};

Flux.prototype.getTransform = function getTransform (el) {
  var scroll = this.scrolled - el.position;
  var uPerS = el.unitPerScroll; // unit per scroll
    
  var transform = {
    y: uPerS.y ? getInRange(el.translate.y[0] + scroll * uPerS.y, el.translate.y) : 0,
    x: uPerS.x ? getInRange(el.translate.x[0] + scroll * uPerS.x, el.translate.x) : 0,
    deg: uPerS.deg ? getInRange(el.rotate[0] + scroll * uPerS.deg, el.rotate) : 0,
    scale: uPerS.scale ? getInRange(el.scale[0] + scroll * uPerS.scale, el.scale) : 1,
    opacity: uPerS.opacity ? getInRange(el.opacity[0] + scroll * uPerS.opacity, el.opacity) : 1
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
};

Flux.prototype.generateFixedData = function generateFixedData (elData) {
  var initTranslateY = 0;
  var deltaTransformY = 0;
  if (elData.translate && elData.translate.y) {
    initTranslateY = getAbsoluteValue(
      elData.translate.y[0],
      elData.translate.unit,
      elData.rect.height
    );
    deltaTransformY = getAbsoluteValue(
      elData.translate.y[1] - elData.translate.y[0] ,
      elData.translate.unit,
      elData.rect.height
    );
  }

  var denominator = this.viewport.height + deltaTransformY + elData.rect.height;
  elData.position = this.scrolled + elData.rect.top + initTranslateY - this.viewport.height;

  elData.unitPerScroll = {
    y: elData.translate.y ? valuePerScroll(elData.translate.y, denominator) : undefined,
    x: elData.translate.x ? valuePerScroll(elData.translate.x, denominator): undefined,
    deg: elData.rotate ? valuePerScroll(elData.rotate, denominator) : undefined,
    scale: elData.scale ? valuePerScroll(elData.scale, denominator) : undefined,
    opacity: elData.opacity ? valuePerScroll(elData.opacity, denominator) : undefined
  };
};

return Flux;

})));
