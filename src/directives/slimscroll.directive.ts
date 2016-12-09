import { Directive, ViewContainerRef, OnInit, Renderer, Inject, Input } from '@angular/core';

export interface ISlimScrollOptions {
  position?: string;
  barBackground?: string;
  barOpacity?: string;
  barWidth?: string;
  barBorderRadius?: string;
  barMargin?: string;
  gridBackground?: string;
  gridOpacity?: string;
  gridWidth?: string;
  gridBorderRadius?: string;
  gridMargin?: string;
}

export class SlimScrollOptions {
  position?: string;
  barBackground?: string;
  barOpacity?: string;
  barWidth?: string;
  barBorderRadius?: string;
  barMargin?: string;
  gridBackground?: string;
  gridOpacity?: string;
  gridWidth?: string;
  gridBorderRadius?: string;
  gridMargin?: string;

  constructor(obj?: ISlimScrollOptions) {
    this.position = obj && obj.position ? obj.position : 'right';
    this.barBackground = obj && obj.barBackground ? obj.barBackground : '#343a40';
    this.barOpacity = obj && obj.barOpacity ? obj.barOpacity : '1';
    this.barWidth = obj && obj.barWidth ? obj.barWidth : '12';
    this.barBorderRadius = obj && obj.barBorderRadius ? obj.barBorderRadius : '5';
    this.barMargin = obj && obj.barMargin ? obj.barMargin : '1px 0';
    this.gridBackground = obj && obj.gridBackground ? obj.gridBackground : '#adb5bd';
    this.gridOpacity = obj && obj.gridOpacity ? obj.gridOpacity : '1';
    this.gridWidth = obj && obj.gridWidth ? obj.gridWidth : '8';
    this.gridBorderRadius = obj && obj.gridBorderRadius ? obj.gridBorderRadius : '10';
    this.gridMargin = obj && obj.gridMargin ? obj.gridMargin : '1px 2px';
  }
}

@Directive({
  selector: '[slimScroll]'
})
export class SlimScrollDirective implements OnInit {
  @Input() options: ISlimScrollOptions;

  private el: HTMLElement;
  private wrapper: HTMLElement;
  private grid: HTMLElement;
  private bar: HTMLElement;
  private body: HTMLElement;
  private pageY: number;
  private top: number;
  private dragging: boolean;
  private mutationThrottleTimeout: number;
  private mutationObserver: MutationObserver;

  constructor(
    @Inject(ViewContainerRef) private viewContainer: ViewContainerRef,
    @Inject(Renderer) private renderer: Renderer) {
    if (typeof window === 'undefined') { return; }
    this.viewContainer = viewContainer;
    this.el = viewContainer.element.nativeElement;
    this.body = document.documentElement.querySelector('body');
    this.mutationThrottleTimeout = 50;
  }

  ngOnInit() {
    if (typeof window === 'undefined') { return; }
    this.options = new SlimScrollOptions(this.options);
    this.destroy();
    this.setElementStyle();
    this.wrapContainer();
    this.initGrid();
    this.initBar();
    this.getBarHeight();
    this.attachWheel(this.el);
    this.makeBarDraggable();

    if (MutationObserver) {
      this.mutationObserver = new MutationObserver(() => {
        if (this.mutationThrottleTimeout) {
          clearTimeout(this.mutationThrottleTimeout);
          this.mutationThrottleTimeout = setTimeout(this.onMutation.bind(this), 50);
        }
      });
      this.mutationObserver.observe(this.el, {subtree: true, childList: true});
    }
  }

  private setElementStyle(): void {
    let el = this.el;
    this.renderer.setElementStyle(el, 'overflow', 'hidden');
    this.renderer.setElementStyle(el, 'position', 'relative');
    this.renderer.setElementStyle(el, 'display', 'block');
  }

  private onMutation() {
    this.getBarHeight();
  }

  private wrapContainer(): void {
    this.wrapper = document.createElement('div');
    let wrapper = this.wrapper;
    let el = this.el;

    this.renderer.setElementClass(wrapper, 'slimscroll-wrapper', true);
    this.renderer.setElementStyle(wrapper, 'position', 'relative');
    this.renderer.setElementStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setElementStyle(wrapper, 'display', 'block');
    this.renderer.setElementStyle(wrapper, 'margin', getComputedStyle(el).margin);
    this.renderer.setElementStyle(wrapper, 'width', getComputedStyle(el).width);
    this.renderer.setElementStyle(wrapper, 'height', getComputedStyle(el).height);

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  private initGrid(): void {
    this.grid = document.createElement('div');
    let grid = this.grid;

    this.renderer.setElementClass(grid, 'slimscroll-grid', true);
    this.renderer.setElementStyle(grid, 'position', 'absolute');
    this.renderer.setElementStyle(grid, 'top', '0');
    this.renderer.setElementStyle(grid, this.options.position, '0');
    this.renderer.setElementStyle(grid, 'width', `${this.options.gridWidth}px`);
    this.renderer.setElementStyle(grid, 'height', '100%');
    this.renderer.setElementStyle(grid, 'background', this.options.gridBackground);
    this.renderer.setElementStyle(grid, 'opacity', this.options.gridOpacity);
    this.renderer.setElementStyle(grid, 'display', 'block');
    this.renderer.setElementStyle(grid, 'cursor', 'pointer');
    this.renderer.setElementStyle(grid, 'z-index', '99');
    this.renderer.setElementStyle(grid, 'border-radius', `${this.options.gridBorderRadius}px`);
    this.renderer.setElementStyle(grid, 'margin', this.options.gridMargin);

    this.wrapper.appendChild(grid);
  }

  private initBar(): void {
    this.bar = document.createElement('div');
    let bar = this.bar;
    let el = this.el;

    this.renderer.setElementClass(bar, 'slimscroll-bar', true);
    this.renderer.setElementStyle(bar, 'position', 'absolute');
    this.renderer.setElementStyle(bar, 'top', '0');
    this.renderer.setElementStyle(bar, this.options.position, '0');
    this.renderer.setElementStyle(bar, 'width', `${this.options.barWidth}px`);
    this.renderer.setElementStyle(bar, 'background', this.options.barBackground);
    this.renderer.setElementStyle(bar, 'opacity', this.options.barOpacity);
    this.renderer.setElementStyle(bar, 'display', 'block');
    this.renderer.setElementStyle(bar, 'cursor', 'pointer');
    this.renderer.setElementStyle(bar, 'z-index', '100');
    this.renderer.setElementStyle(bar, 'border-radius', `${this.options.barBorderRadius}px`);
    this.renderer.setElementStyle(bar, 'margin', this.options.barMargin);

    this.wrapper.appendChild(bar);
  }

  private getBarHeight(): void {
    setTimeout(() => {
      let barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
      let display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';

      this.renderer.setElementStyle(this.bar, 'height', barHeight);
      this.renderer.setElementStyle(this.bar, 'display', display);
    }, 1);
  }

  private attachWheel(target: HTMLElement): void {
    target.addEventListener('DOMMouseScroll', this.onWheel, false);
    target.addEventListener('mousewheel', this.onWheel, false);
  }

  private onWheel = (e: MouseWheelEvent) => {
    let delta = 0;
    let target = e.target || e.srcElement;

    if (e.wheelDelta) { delta = -e.wheelDelta / 120; }
    if (e.detail) { delta = e.detail / 3; }

    this.scrollContent(delta, true, false);

    if (e.preventDefault) { e.preventDefault(); }
  };

  private scrollContent(y: number, isWheel: boolean, isJump: boolean): void {
    let delta = y;
    let maxTop = this.el.offsetHeight - this.bar.offsetHeight;
    let percentScroll: number;
    let barTop: number;
    let bar = this.bar;
    let el = this.el;

    if (isWheel) {
      delta = parseInt(getComputedStyle(bar).top, 10) + y * 20 / 100 * bar.offsetHeight;
      delta = Math.min(Math.max(delta, 0), maxTop);
      delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);
      this.renderer.setElementStyle(bar, 'top', delta + 'px');
    }

    percentScroll = parseInt(getComputedStyle(bar).top, 10) / (el.offsetHeight - bar.offsetHeight);
    delta = percentScroll * (el.scrollHeight - el.offsetHeight);

    el.scrollTop = delta;
  }

  private makeBarDraggable = () => {
    let body = document.getElementsByTagName('body')[0];
    let el = this.el;
    let bar = this.bar;

    bar.addEventListener('mousedown', (e: MouseEvent) => {
      if (!this.dragging) {
        this.pageY = e.pageY;
        this.top = parseFloat(getComputedStyle(this.bar).top);
      }

      this.dragging = true;
      this.body.addEventListener('mousemove', this.barDraggableListener, false);
      this.body.addEventListener('selectstart', this.preventDefaultEvent, false);
    }, false);

    this.body.addEventListener('mouseup', () => {
      this.body.removeEventListener('mousemove', this.barDraggableListener, false);
      this.body.removeEventListener('selectstart', this.preventDefaultEvent, false);
      this.dragging = false;
    }, false);
  };

  private preventDefaultEvent = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  private barDraggableListener = (e: MouseEvent) => {
    let top = this.top + e.pageY - this.pageY;
    this.renderer.setElementStyle(this.bar, 'top', `${top}px`);
    this.scrollContent(0, true, false);
  };

  private destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
      let wrapper = this.el.parentElement;
      let bar = this.el.querySelector('.slimscroll-bar');
      this.el.removeChild(bar);
      this.unwrap(wrapper);
    }
  }

  private unwrap(wrapper: HTMLElement): void {
    let docFrag = document.createDocumentFragment();
    while (wrapper.firstChild) {
      let child = wrapper.removeChild(wrapper.firstChild);
      docFrag.appendChild(child);
    }
    wrapper.parentNode.replaceChild(docFrag, wrapper);
  }
}
