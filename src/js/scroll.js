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
    this.elements = this.elementsData.map(data => select(data.element));

    // eslint-disable-next-line
    this.elements.forEach((el, index) => {
      this.addMissingTransformation(this.elementsData[index]);
      el.style.transform = `
      translate3d(
        ${this.elementsData[index].translate.x[0]}${this.elementsData[index].translate.unit},
        ${this.elementsData[index].translate.y[0]}${this.elementsData[index].translate.unit},
        0
      )
      rotate(${this.elementsData[index].rotate[0]}deg)
      scale(${this.elementsData[index].scale[0]})`;
      el.style.opacity = this.elementsData[index].opacity[0];

      this.generateFixedData(this.elementsData[index], el)
      this.observer.observe(el);
    })
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
      this.scrolled = window.scrollY
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
      this.update();
    }, 100));
  }

  update() {
    this.elements.forEach((el, index) => {
      if (!el.classList.contains('is-inViewPort')) {
        el.classList.remove(this.elementsData[index].class);
        return;
      }
      const elData = this.elementsData[index];
      if (elData.class) el.classList.add('is-active');
      this.transform = this.getTransform(elData);
      console.log(this.transform)

      el.style.transform = `
        translate3d(
          ${this.transform.x}${elData.translate.unit},
          ${this.transform.y}${elData.translate.unit},
          0
        )
        rotate(${this.transform.deg}deg)
        scale(${this.transform.scale})`;
      el.style.opacity = this.transform.opacity;
    });
  }

  getTransform(el) {
    const ratio = this.scrolled - el.position;

    return {
      y: getInRange(el.translate.y[0] + Math.sign(el.translate.y[1]) * ratio * el.unitPerScroll.y, el.translate.y),
      x: getInRange(el.translate.x[0] + Math.sign(el.translate.x[1]) * ratio * el.unitPerScroll.x, el.translate.x),
      deg: getInRange(el.rotate[0] + Math.sign(el.rotate[1]) * ratio * el.unitPerScroll.deg, el.rotate),
      scale: getInRange(el.scale[0] + (el.scale[0] > el.scale[1] ? -1 : 1) * ratio * el.unitPerScroll.scale, el.scale),
      opacity: getInRange(el.opacity[0] + (el.opacity[0] > el.opacity[1] ? -1 : 1) * ratio * el.unitPerScroll.opacity, el.opacity)
    }
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

  generateFixedData(elData, el) {
    const rect = el.getBoundingClientRect()
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
    const deltaTransformY = elData.translate.unit === 'px' ? deltaTransform.y : el.parentNode.clientHeight * deltaTransform.y / 100;
    const denominator = this.viewport.height + deltaTransformY + sign * rect.height;

    elData.rect = rect;
    elData.position = this.scrolled + rect.top - this.viewport.height;
    elData.unitPerScroll = {
      y: deltaTransform.y / denominator,
      x: deltaTransform.x / denominator,
      deg: deltaTransform.deg / denominator,
      scale: deltaTransform.scale / denominator,
      opacity: deltaTransform.opacity / denominator
    }
  }
}

export default Scroll;
