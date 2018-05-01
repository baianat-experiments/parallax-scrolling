/**
    * v0.0.0
    * (c) 2018 Baianat
    * @license MIT
    */
var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

/**
 * Utilities
 */
function select(element) {
  if (typeof element === 'string') {
    return document.querySelector(element);
  }
  return element;
}

function throttle(func) {
  var _arguments = arguments;
  var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;

  var wait = false;
  return function () {
    if (!wait) {
      func.apply(undefined, _arguments);
      wait = true;
      setTimeout(function () {
        wait = false;
      }, limit);
    }
  };
}

function getInRange(value, _ref) {
  var _ref2 = slicedToArray(_ref, 2),
      start = _ref2[0],
      end = _ref2[1];

  var max = start > end ? start : end;
  var min = start < end ? start : end;

  return Math.max(Math.min(value, max), min);
}

function getAbsoluteValue(value, unit, elHeight) {
  return unit === 'px' ? value : value / 100 * elHeight;
}
function valuePerScroll(_ref3, denominator) {
  var _ref4 = slicedToArray(_ref3, 2),
      start = _ref4[0],
      end = _ref4[1];

  return (end - start) / denominator;
}

var Flux = function () {
  function Flux() {
    var elmData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$breakpoint = _ref.breakpoint,
        breakpoint = _ref$breakpoint === undefined ? 0 : _ref$breakpoint;

    classCallCheck(this, Flux);

    this.elementsData = elmData;
    this.settings = {
      breakpoint: breakpoint
    };
    this._init();
  }

  createClass(Flux, [{
    key: 'addElement',
    value: function addElement(elmData) {
      var _this = this;

      this.elementsData.push(elmData);
      this._initElements();
      setTimeout(function () {
        return _this.update();
      }, 500);
    }
  }, {
    key: '_init',
    value: function _init() {
      var _this2 = this;

      this.scrolled = window.scrollY;
      this.viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      document.onreadystatechange = function () {
        if (document.readyState === 'complete') {
          _this2._initObserver();
          _this2._initElements();
          _this2._initEvents();
          _this2.update(true);
        }
      };
    }
  }, {
    key: '_initElements',
    value: function _initElements() {
      var _this3 = this;

      this.mediaQuery = window.matchMedia('(min-width: ' + this.settings.breakpoint + 'px)');
      this.elements = [];
      this.elementsData.forEach(function (data) {
        var elm = select(data.element);
        data.element = elm;

        if (!data.omit) {
          data.rect = elm.getBoundingClientRect();
          _this3.addMissingTransformation(data);
          _this3.generateFixedData(data);
        }

        _this3.observer.observe(elm);
        _this3.elements.push(data.element);
      });
    }
  }, {
    key: '_initObserver',
    value: function _initObserver() {
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
    }
  }, {
    key: '_initEvents',
    value: function _initEvents() {
      var _this4 = this;

      this.scrolling = false;

      // scroll optimization https://developer.mozilla.org/en-US/docs/Web/Events/scroll
      window.addEventListener('scroll', function () {
        _this4.scrolled = window.scrollY;
        if (!_this4.scrolling) {
          window.requestAnimationFrame(function () {
            _this4.update();
            _this4.scrolling = false;
          });
          _this4.scrolling = true;
        }
      }, {
        passive: true
      });

      window.addEventListener('resize', throttle(function () {
        _this4.viewport = {
          height: window.innerHeight,
          width: window.innerWidth
        };
        _this4.scrolled = window.scrollY;
        _this4.elementsData.forEach(function (data) {
          if (!data.omit) {
            data.rect = data.element.getBoundingClientRect();
            _this4.generateFixedData(data);
          }
        });
        _this4.update();
      }, 100));
    }
  }, {
    key: 'update',
    value: function update() {
      var _this5 = this;

      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      this.elements.forEach(function (el, index) {
        var elData = _this5.elementsData[index];
        if (!el.dataset.fluxInViewport && elData.class && Object.values(elData.class)[0] === 'toggle') {
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

        if (!_this5.mediaQuery.matches) {
          elData.element.style.transform = '';
          elData.element.style.opacity = '';
          return;
        }

        if (!elData.omit) {
          _this5.transform = _this5.getTransform(elData);
          el.style.transform = '\n          translateX(' + _this5.transform.x + elData.translate.unit + ')\n          translateY(' + _this5.transform.y + elData.translate.unit + ')\n          rotate(' + _this5.transform.deg + 'deg)\n          scale(' + _this5.transform.scale + ')';
          el.style.opacity = _this5.transform.opacity;
        }
      });
    }
  }, {
    key: 'getTransform',
    value: function getTransform(el) {
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
    }
  }, {
    key: 'addMissingTransformation',
    value: function addMissingTransformation(el) {
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
    }
  }, {
    key: 'generateFixedData',
    value: function generateFixedData(elData) {
      var initTranslateY = 0;
      var deltaTransformY = 0;
      if (elData.translate && elData.translate.y) {
        initTranslateY = getAbsoluteValue(elData.translate.y[0], elData.translate.unit, elData.rect.height);
        deltaTransformY = getAbsoluteValue(elData.translate.y[1] - elData.translate.y[0], elData.translate.unit, elData.rect.height);
      }

      var denominator = this.viewport.height + deltaTransformY + elData.rect.height;
      elData.position = this.scrolled + elData.rect.top + initTranslateY - this.viewport.height;

      elData.unitPerScroll = {
        y: elData.translate.y ? valuePerScroll(elData.translate.y, denominator) : undefined,
        x: elData.translate.x ? valuePerScroll(elData.translate.x, denominator) : undefined,
        deg: elData.rotate ? valuePerScroll(elData.rotate, denominator) : undefined,
        scale: elData.scale ? valuePerScroll(elData.scale, denominator) : undefined,
        opacity: elData.opacity ? valuePerScroll(elData.opacity, denominator) : undefined
      };
    }
  }]);
  return Flux;
}();

export default Flux;
