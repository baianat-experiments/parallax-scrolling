import { select, throttle, getInRange } from './util'

class Scroll {
  constructor(elmData = []) {
    this.elementsData = elmData;
    this._init();
  }

  addElement(elmData) {
    this.elementsData.push(elmData);
    this._initElements();
    setTimeout(() => this.update(), 500);
  }

  _init() {
    this.scrolled = window.scrollY;
    this.viewport = {
      height: window.innerHeight,
      width: window.innerWidth
    }

    this._initObserver();
    this._initElements();
    this._initEvents();
    setTimeout(() => this.update(), 500);
  }

  _initElements() {
    this.elements = []
    this.elementsData.forEach(data => {
      const elm = select(data.element);
      data.element = elm;

      if (!data.omit) {
        data.rect = elm.getBoundingClientRect();
        this.addMissingTransformation(data);
        this.generateFixedData(data);
        elm.style.opacity = data.opacity[0];
        elm.style.transform = `
          translate3d(
            ${data.translate.x[0]}${data.translate.unit},
            ${data.translate.y[0]}${data.translate.unit},
            0
          )
          rotate(${data.rotate[0]}deg)
          scale(${data.scale[0]})`;
      }

      this.observer.observe(elm);
      this.elements.push(data.element);
    });
  }

  _initObserver() {
    // eslint-disable-next-line
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {
          entry.target.classList.add('is-inViewPort');
          return;
        }
        entry.target.classList.remove('is-inViewPort');
      });
    }, { threshold: [0, 0.25, 0.75, 1] });
  }

  _initEvents() {
    this.scrolling = false;
    window.addEventListener('scroll', () => {
      this.scrolled = window.scrollY;
      if (!this.scrolling) {
        window.requestAnimationFrame(() => {
          this.update();
          this.scrolling = false;
        });

        this.scrolling = true;
      }
    });

    window.addEventListener('resize', throttle(() => {
      this.viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      }
      this.scrolled = window.scrollY
      this.elements.forEach((el, index) => {
        this.generateFixedData(this.elementsData[index], el)
      })
      console.log(this.elementsData);
      this.update();
    }, 100));
  }

  update() {
    this.elements.forEach((el, index) => {
      const elData = this.elementsData[index];
      if (
        !el.classList.contains('is-inViewPort') &&
        elData.class &&
        Object.values(elData.class)[0] === 'toggle'
      ) {
        el.classList.remove(Object.keys(elData.class)[0]);
        return;
      }

      if (!el.classList.contains('is-inViewPort')) {
        return;
      }

      if (elData.class) {
        const className = typeof elData.class === 'string' ? elData.class : Object.keys(elData.class)[0];
        el.classList.add(className);
      }

      if (!elData.omit) {
        this.transform = this.getTransform(elData);
        el.style.transform = `
          translate3d(
            ${this.transform.x}${elData.translate.unit},
            ${this.transform.y}${elData.translate.unit},
            0
          )
          rotate(${this.transform.deg}deg)
          scale(${this.transform.scale})`;
        el.style.opacity = this.transform.opacity;
      }
    });
  }

  getTransform(el) {
    const scroll = this.scrolled - el.position;
    const uPerS = el.unitPerScroll;

    const transform = {
      y: uPerS.y ? getInRange(el.translate.y[0] + scroll * uPerS.y, el.translate.y) : 0,
      x: uPerS.x ? getInRange(el.translate.x[0] + scroll * el.unitPerScroll.x, el.translate.x) : 0,
      deg: uPerS.deg ? getInRange(el.rotate[0] + scroll * el.unitPerScroll.deg, el.rotate) : 0,
      scale: uPerS.scale ? getInRange(el.scale[0] + scroll * el.unitPerScroll.scale, el.scale) : 1,
      opacity: uPerS.opacity ? getInRange(el.opacity[0] + scroll * el.unitPerScroll.opacity, el.opacity) : 1
    };
    return transform;
  }

  addMissingTransformation(el) {
    if (!el.translate) {
      el.translate = {}
    }
    if (!el.translate.x) {
      el.translate.x = [0, 0]
    }
    if (!el.translate.y) {
      el.translate.y = [0, 0]
    }
    if (!el.translate.unit) {
      el.translate.unit = 'px'
    }
    if (!el.rotate) {
      el.rotate = [0, 0]
    }
    if (!el.opacity) {
      el.opacity = [1, 1]
    }
    if (!el.scale) {
      el.scale = [1, 1]
    }
  }

  generateFixedData(elData) {
    const deltaTransform = {
      y: Math.abs(elData.translate.y[1] - elData.translate.y[0]),
      x: Math.abs(elData.translate.x[1] - elData.translate.x[0]),
      deg: Math.abs(elData.rotate[1] - elData.rotate[0]),
      scale: Math.abs(elData.scale[1] - elData.scale[0]),
      opacity: Math.abs(elData.opacity[1] - elData.opacity[0])
    }
    const sign = deltaTransform.y === 0 || elData.translate.y[1] === 0
      ? 1
      : Math.sign(elData.translate.y[1]);
    const deltaTransformY = elData.translate.unit === 'px'
      ? deltaTransform.y
      : elData.element.parentNode.clientHeight * deltaTransform.y / 100;
    const denominator = this.viewport.height + deltaTransformY + sign * elData.rect.height;

    elData.position = this.scrolled + elData.rect.top - this.viewport.height;
    elData.unitPerScroll = {
      y: (Math.sign(elData.translate.y[1]) * deltaTransform.y) / denominator,
      x: (Math.sign(elData.translate.x[1]) * deltaTransform.x) / denominator,
      deg: (Math.sign(elData.rotate[1]) * deltaTransform.deg) / denominator,
      scale: ((elData.scale[0] > elData.scale[1] ? -1 : 1) * deltaTransform.scale) / denominator,
      opacity: ((elData.opacity[0] > elData.opacity[1] ? -1 : 1) * deltaTransform.opacity) / denominator
    }
  }
}

export default Scroll;
