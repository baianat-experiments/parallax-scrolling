import { select, throttle, getInRange, getAbsoluteValue, valuePerScroll } from './util';

class Flux {
  constructor (elmData = [], { breakpoint = 0 } = {}) {
    this.elementsData = elmData;
    this.settings = {
      breakpoint
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
    document.onreadystatechange = () => {
      if (document.readyState === 'complete') {
        this._initObserver();
        this._initElements();
        this._initEvents();
        this.update(true);
      }
    };
  }

  _initElements () {
    this.mediaQuery = window.matchMedia(`(min-width: ${this.settings.breakpoint}px)`);
    this.elements = [];
    this.elementsData.forEach(data => {
      const elm = select(data.element);
      data.element = elm;

      if (!data.omit) {
        data.rect = elm.getBoundingClientRect();
        this.addMissingTransformation(data);
        this.generateFixedData(data);
      }

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
    this.scrolling = false;

    // scroll optimization https://developer.mozilla.org/en-US/docs/Web/Events/scroll
    window.addEventListener('scroll', () => {
      this.scrolled = window.scrollY;
      if (!this.scrolling) {
        window.requestAnimationFrame(() => {
          this.update();
          this.scrolling = false;
        });
        this.scrolling = true;
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
      this.elementsData.forEach(data => {
        if (!data.omit) {
          data.rect = data.element.getBoundingClientRect();
          this.generateFixedData(data);
        }
      });
      this.update();
    }, 100));
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

      if (elData.class) {
        const className = typeof elData.class === 'string' ? elData.class : Object.keys(elData.class)[0];
        el.classList.add(className);
      }

      if (!this.mediaQuery.matches) {
        elData.element.style.transform = '';
        elData.element.style.opacity = '';
        return;
      }

      if (!elData.omit) {
        this.transform = this.getTransform(elData);
        el.style.transform = `
          translateX(${this.transform.x}${elData.translate.unit})
          translateY(${this.transform.y}${elData.translate.unit})
          rotate(${this.transform.deg}deg)
          scale(${this.transform.scale})`;
        el.style.opacity = this.transform.opacity;
      }
    });
  }

  getTransform (el) {
    const scroll = this.scrolled - el.position;
    const uPerS = el.unitPerScroll; // unit per scroll

    const transform = {
      y: uPerS.y ? getInRange(el.translate.y[0] + scroll * uPerS.y, el.translate.y) : 0,
      x: uPerS.x ? getInRange(el.translate.x[0] + scroll * uPerS.x, el.translate.x) : 0,
      deg: uPerS.deg ? getInRange(el.rotate[0] + scroll * uPerS.deg, el.rotate) : 0,
      scale: uPerS.scale ? getInRange(el.scale[0] + scroll * uPerS.scale, el.scale) : 1,
      opacity: uPerS.opacity ? getInRange(el.opacity[0] + scroll * uPerS.opacity, el.opacity) : 1
    };
    return transform;
  }

  addMissingTransformation (el) {
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
      initTranslateY = getAbsoluteValue(
        elData.translate.y[0],
        elData.translate.unit,
        elData.rect.height
      );
      deltaTransformY = getAbsoluteValue(
        elData.translate.y[1] - elData.translate.y[0],
        elData.translate.unit,
        elData.rect.height
      );
    }

    const denominator = this.viewport.height + deltaTransformY + elData.rect.height;
    elData.position = this.scrolled + elData.rect.top + initTranslateY - this.viewport.height;

    elData.unitPerScroll = {
      y: elData.translate.y ? valuePerScroll(elData.translate.y, denominator) : undefined,
      x: elData.translate.x ? valuePerScroll(elData.translate.x, denominator) : undefined,
      deg: elData.rotate ? valuePerScroll(elData.rotate, denominator) : undefined,
      scale: elData.scale ? valuePerScroll(elData.scale, denominator) : undefined,
      opacity: elData.opacity ? valuePerScroll(elData.opacity, denominator) : undefined
    };
  }
}

export default Flux;
