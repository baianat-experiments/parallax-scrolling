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
      this.scrolled = window.scrollY;
      this.viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      this._initObserver();
      this._initElements();
      this._initEvents();
      this.update(true);
    }
  }, {
    key: '_initElements',
    value: function _initElements() {
      var _this2 = this;

      this.mediaQuery = window.matchMedia('(min-width: ' + this.settings.breakpoint + 'px)');
      this.elements = [];
      this.elementsData.forEach(function (data) {
        var elm = select(data.element);
        data.element = elm;

        if (!data.omit) {
          data.rect = elm.getBoundingClientRect();
          _this2.addMissingTransformation(data);
          _this2.generateFixedData(data);
        }

        _this2.observer.observe(elm);
        _this2.elements.push(data.element);
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
      var _this3 = this;

      this.ticking = false;

      // scroll optimization https://developer.mozilla.org/en-US/docs/Web/Events/scroll
      window.addEventListener('scroll', function () {
        _this3.scrolled = window.scrollY;
        if (!_this3.ticking) {
          window.requestAnimationFrame(function () {
            _this3.update();
            _this3.ticking = false;
          });
          _this3.ticking = true;
        }
      }, {
        passive: true
      });

      window.addEventListener('resize', throttle(function () {
        _this3.viewport = {
          height: window.innerHeight,
          width: window.innerWidth
        };
        _this3.scrolled = window.scrollY;
        _this3.elementsData.forEach(function (data) {
          if (!data.omit) {
            data.rect = data.element.getBoundingClientRect();
            _this3.generateFixedData(data);
          }
        });
        _this3.update(true);
      }, 100));
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      this.elements.forEach(function (el, index) {
        var elData = _this4.elementsData[index];
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

        if (!_this4.mediaQuery.matches) {
          elData.element.style.transform = '';
          elData.element.style.opacity = '';
          return;
        }

        if (!elData.omit) {
          var uPerS = elData.unitPerScroll; // unit per scroll
          var unit = elData.translate.unit;
          var position = elData.position;
          /* eslint-disable */
          el.style.transform = '\n          ' + (uPerS.x ? 'translateX(' + _this4.getTransform(elData.transform.x, uPerS.x, position) + unit + ')' : '') + '\n          ' + (uPerS.y ? 'translateY(' + _this4.getTransform(elData.transform.y, uPerS.y, position) + unit + ')' : '') + '\n          ' + (uPerS.deg ? 'rotate(' + _this4.getTransform(elData.rotate, uPerS.deg, position) + 'deg)' : '') + '\n          ' + (uPerS.scale ? 'scale(' + _this4.getTransform(elData.scale, uPerS.scale, position) + ')' : '');

          /* eslint-enable */
          el.style.opacity = uPerS.opacity ? _this4.getTransform(elData.opacity, uPerS.opacity, position) : '';
        }
      });
    }
  }, {
    key: 'getTransform',
    value: function getTransform(values, unitPerValue, elPosition) {
      var scroll = this.scrolled - elPosition;
      return getInRange(values[0] + scroll * unitPerValue, values);
    }
  }, {
    key: 'addMissingTransformation',
    value: function addMissingTransformation(el) {
      if (!el.translate) {
        el.translate = {};
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
