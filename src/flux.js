import { select, throttle, getInRange, getAbsoluteValue } from './util';

class Flux {
  constructor (elmData = [], settings) {
    this.elementsData = elmData;
    this.settings = {
      ...Flux.defaults,
      ...settings
    };
    this._init();
  }

  addElement (elmData) {
    this.elementsData.push(elmData);
    this._initElements();
    setTimeout(() => this.update(), 500);
  }

  _init () {
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

  _initElements () {
    this.mediaQuery = window.matchMedia(`(min-width: ${this.settings.breakpoint}px)`);
    this.elements = [];
    this.elementsData.forEach(data => {
      const elm = select(data.element);
      elm.style.willChange = 'transform';
      data.element = elm;
      data.rect = elm.getBoundingClientRect();
      this.addMissingData(data);
      this.generateFixedData(data);
      this.observer.observe(elm);
      this.elements.push(data.element);
    });
  }

  _initObserver () {
    // eslint-disable-next-line
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.dataset.fluxInViewport = 'true';
          return;
        }
        entry.target.dataset.fluxInViewport = '';
      });
    });
  }

  _initEvents () {
    this.ticking = false;

    // scroll optimization https://developer.mozilla.org/en-US/docs/Web/Events/scroll
    window.addEventListener('scroll', () => {
      this.scrolled = window.scrollY;
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.update();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, {
      passive: true
    });

    window.addEventListener('resize', throttle(() => {
      this.viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      this.scrolled = window.scrollY;
      this.reload();
    }, 100));
  }

  reload () {
    this.elementsData.forEach(data => {
      data.rect = data.element.getBoundingClientRect();
      this.generateFixedData(data);
    });
    this.update(true);
  }

  update (force = false) {
    this.elements.forEach((el, index) => {
      const elData = this.elementsData[index];
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
      if (!this.mediaQuery.matches) {
        elData.element.style.transform = '';
        elData.element.style.opacity = '';
        return;
      }
      if (elData.class) {
        const className = typeof elData.class === 'string'
          ? elData.class
          : Object.keys(elData.class)[0];
        el.classList.add(className);
      }
      this.updateTransformation(el, elData);
    });
  }

  updateTransformation (element, elData) {
    const uPerS = elData.unitPerScroll; // unit per scroll
    const unit = elData.translate.unit;
    const scroll = this.scrolled - elData.position;

    element.style.transform = `
      ${uPerS.x ? `translateX(${getTransform(elData.translate.x, uPerS.x)}${unit})` : ''}
      ${uPerS.y ? `translateY(${getTransform(elData.translate.y, uPerS.y)}${unit})` : ''}
      ${uPerS.deg ? `rotate(${getTransform(elData.rotate, uPerS.deg)}deg)` : ''}
      ${uPerS.scale ? `scale(${getTransform(elData.scale, uPerS.scale)})` : ''}
    `;
    element.style.opacity = uPerS.opacity ? getTransform(elData.opacity, uPerS.opacity) : '';
    function getTransform (values, unitPerValue) {
      return getInRange(values[0] + scroll * unitPerValue, values);
    };
  }

  addMissingData (el) {
    if (!el.translate) {
      el.translate = {};
    }
    if (!el.translate.unit) {
      el.translate.unit = 'px';
    }
  }

  generateFixedData (elData) {
    let initTranslateY = 0;
    let deltaTransformY = 0;
    if (elData.translate && elData.translate.y) {
      initTranslateY = getAbsoluteValue(elData.translate.y[0]);
      deltaTransformY = getAbsoluteValue(elData.translate.y[1] - elData.translate.y[0]);
    }
    const denominator = 
      ((elData.finishRatio || this.settings.finishRatio) * this.viewport.height)
      + (this.settings.outOfViewport ? elData.rect.height : 0)
      + deltaTransformY;

    /* eslint-disable no-multi-spaces */
    elData.position = this.scrolled + elData.rect.top + initTranslateY - this.viewport.height;
    elData.unitPerScroll = {
      ...elData.translate.y && { y: valuePerScroll(elData.translate.y) },
      ...elData.translate.x && { x: valuePerScroll(elData.translate.x) },
      ...elData.rotate      && { deg: valuePerScroll(elData.rotate) },
      ...elData.scale       && { scale: valuePerScroll(elData.scale) },
      ...elData.opacity     && { opacity: valuePerScroll(elData.opacity) }
    };
    /* eslint-enable */

    function getAbsoluteValue (value)  {
      return elData.translate.unit === 'px' 
        ? value 
        : value / 100 * elData.rect.height;
    }
    function valuePerScroll ([start, end]) {
      return (end - start) / denominator;
    };
  }

  // eslint-disable-next-line
  static defaults = {
    breakpoint: 0,
    finishRatio: 1,
    outOfViewport: true
  }
  
}

export default Flux;
