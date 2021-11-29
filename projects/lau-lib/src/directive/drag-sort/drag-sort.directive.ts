import {AfterViewInit, Directive, ElementRef, NgZone} from '@angular/core';

@Directive({
  selector: '[drag-sort]'
})

export class DragSortDirective implements AfterViewInit {

  // 是否点击了可拖曳元素
  public isPointerDown: boolean = false;
  // 距离上次的平移的差值
  public diff: { x: number, y: number } = {x: 0, y: 0};
  // 被拖曳元素的数据：ele：拖曳元素的DOM；index：被拖到的位置的index；lastIndex：旧的位置对应的index
  public drag: { ele: any, index: number, lastIndex: number } = {ele: null, index: 0, lastIndex: 0};
  // 被释放元素的数据，格式如上
  public drop: { ele: any, index: number, lastIndex: number } = {ele: null, index: 0, lastIndex: 0};
  // 拖曳元素时需要克隆被拖曳的元素
  public clone: { ele: any, x: 0, y: 0 } = {ele: null, x: 0, y: 0};
  // 鼠标上次移动的位置
  public lastPointerMove: { x: number, y: number } = {x: 0, y: 0};
  // 用于保存拖曳项 getBoundingClientRect 方法获取的数据
  public childRects: any[] = [];
  // 父容器调用 getBoudingClientRect 获取的数据
  public fatherRect: any;
  // 滚动条定时器
  public scrollUpTimer: number;
  public scrollDownTimer: number;

  constructor(
    private parent: ElementRef<HTMLElement>,
    private ngZone: NgZone
  ) {
  }

  ngAfterViewInit() {
    // 频繁更新 DOM 需要在 Angular 区域外进行操作
    this.ngZone.runOutsideAngular(() => {
      // 绑定事件监听器
      this.bindListener();
    });
  }

  /**
   * 绑定事件监听器
   */
  public bindListener() {
    this.parent.nativeElement.addEventListener('pointerdown', this.handlePointerDown);
    this.parent.nativeElement.addEventListener('pointermove', this.handlePointerMove);
    this.parent.nativeElement.addEventListener('pointerup', this.handlePointerUp);
    this.parent.nativeElement.addEventListener('pointercancel', this.handlePointerUp);
    window.addEventListener('scroll', this.getRect);
    window.addEventListener('resize', this.getRect);
    window.addEventListener('orientationchange', this.getRect);
  }

  /**
   * 获取拖曳项的位置信息
   */
  public getRect() {
    // 获取父元素的 rect
    this.fatherRect = this.parent.nativeElement.getBoundingClientRect();
    // 获取各个子元素的 rect
    this.childRects = [];
    for (let i = 0; i < this.parent.nativeElement.children.length; i++) {
      this.childRects.push(this.parent.nativeElement.children[i].getBoundingClientRect());
    }
  }

  /**
   * 处理鼠标点击的动作
   * 此处需要定义称为箭头函数，因为 JS 中 this 指针指向
   * @param e
   */
  public handlePointerDown = (event: PointerEvent) => {
    // 如果是鼠标点击，且不是左键，直接返回
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    // 如果事件的 target 是属于 parent，则直接返回
    if (event.target === this.parent.nativeElement) {
      return;
    }
    // 获取 container 中 children 的完全尺寸信息
    this.getRect();
    this.isPointerDown = true;
    this.parent.nativeElement.setPointerCapture(event.pointerId);
    // 记录鼠标 PointerDown 时的坐标
    this.lastPointerMove = {x: event.clientX, y: event.clientY};
    // 记录当前正在被拖曳的元素
    this.drag.ele = this.getTargetElement(event.target as HTMLElement);
    // todo 为拖曳的元素添加样式
    this.setActiveStyle(this.drag.ele);
    // 为正在拖曳的元素克隆一个 DOM 节点
    this.clone.ele = this.drag.ele.cloneNode(true);
    this.clone.ele.style.transition = 'none';
    // 获取被拖曳元素在容器内的位置
    const i = [].indexOf.call(this.parent.nativeElement.children, this.drag.ele);
    // 更新 clone 的位置信息
    this.clone = {...this.clone, x: this.childRects[i].left, y: this.childRects[i].top};
    // 更新 drag 中的 index 和 lastIndex
    this.drag = {...this.drag, index: i, lastIndex: i};
    // 设置 clone 元素的样式
    this.setCloneEleStyle(this.clone.ele);
    // 根据 clone 的位置信息更新 clone 的实时位置
    this.clone.ele.style.transform = `translate(${this.clone.x}px, ${this.clone.y}px)`;
    document.body.appendChild(this.clone.ele);
  };

  /**
   * 处理鼠标移动事件
   * 此处只能定义成箭头函数
   * @param event
   */
  public handlePointerMove = (event: PointerEvent) => {
    // 没有按下鼠标左键直接返回
    if (!this.isPointerDown) {
      return;
    }

    // 更新 clone 元素位置
    this.diff = {x: event.clientX - this.lastPointerMove.x, y: event.clientY - this.lastPointerMove.y};
    this.lastPointerMove = {x: event.clientX, y: event.clientY};
    this.clone.x += this.diff.x;
    this.clone.y += this.diff.y;
    this.clone.ele.style.transform = `translate(${this.clone.x}px, ${this.clone.y}px)`;

    // 检测有无超过父容器的上边界
    if (event.clientY < this.fatherRect.top) {
      if (this.scrollUpTimer == null) {
        this.scrollUpTimer = setInterval(() => {
          // 操作滚动条向上滚动
          if (this.parent.nativeElement.scrollTop > 0) {
            this.parent.nativeElement.scrollTop--
          }
          else {
            this.removeInterval(['scrollUpTimer']);
          }
        });
      }
      return;
    }
    // 检测有无超过父容器的下边界
    else if (event.clientY > this.fatherRect.bottom) {
      if (this.scrollDownTimer == null) {
        this.scrollDownTimer = setInterval(() => {
          // 操作滚动条向下滚动
          if (this.parent.nativeElement.scrollTop + this.parent.nativeElement.clientHeight < this.parent.nativeElement.scrollHeight) {
            this.parent.nativeElement.scrollTop++;
          }
          else {
            this.removeInterval(['scrollDownTimer']);
          }
        });
      }
      return;
    }

    // 定时器不为空则移除定时器
    if (this.scrollUpTimer || this.scrollDownTimer) {
      this.removeInterval(['scrollUpTimer', 'scrollDownTimer']);
    }

    // 遍历元素，寻找交换位置的元素，并完成位置交换
    for (let i = 0; i < this.childRects.length; i++) {
      // 碰撞检测
      if (event.clientX > this.childRects[i].left && event.clientX < this.childRects[i].right &&
        event.clientY > this.childRects[i].top && event.clientY < this.childRects[i].bottom) {
        // 将当前元素记录为释放元素
        this.drop.ele = this.parent.nativeElement.children[i];
        // 记录当前元素的 index
        this.drop.lastIndex = i;
        if (this.drag.ele !== this.drop.ele) {
          if (this.drag.index < i) {
            this.parent.nativeElement.insertBefore(this.drag.ele, this.drop.ele.nextElementSibling);
            this.drop.index = i - 1;
          } else {
            this.parent.nativeElement.insertBefore(this.drag.ele, this.drop.ele);
            this.drop.index = i + 1;
          }
          // 将 drag 的 index 值赋为当前 drop 元素的 index
          this.drag.index = i;
          // 根据 drag 和 drop 元素的 index 和 lastIndex 来获取 drag 和 drop 元素拖曳动作前后的位置
          const dragRect = this.childRects[this.drag.index];
          const lastDragRect = this.childRects[this.drag.lastIndex];
          const dropRect = this.childRects[this.drop.index];
          const lastDropRect = this.childRects[this.drop.lastIndex];
          // 获取完位置后，更新 drag 元素的 lastIndex 用于下一个轮回的逻辑
          this.drag.lastIndex = i;
          // 先行清空元素的过渡属性
          this.drag.ele.style.transition = 'none';
          this.drop.ele.style.transition = 'none';
          // 使用 translate3d 属性，将 drag 和 drop 元素偏移到原本的位置 (是在 drag 和 drop 拖曳完成的位置进行偏移)
          this.drag.ele.style.transform = `translate3d(${lastDragRect.left - dragRect.left}px, ${lastDragRect.top - dragRect.top}px, 0)`;
          this.drop.ele.style.transform = `translate3d(${lastDropRect.left - dropRect.left}px, ${lastDropRect.top - dropRect.top}px, 0)`;
          // 触发重绘
          this.drag.ele.offsetLeft;
          // 为 transform 添加过渡属性
          this.drag.ele.style.transition = 'transform 150ms';
          this.drop.ele.style.transition = 'transform 150ms';
          // 设置完 transition 过渡属性之后，然后通过 translate3d 属性进行位置还原，从而产生动画过渡效果
          this.drag.ele.style.transform = 'translate3d(0px, 0px, 0px)';
          this.drop.ele.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        break;
      }
    }
  };

  /**
   * 处理鼠标按钮松开回调
   * 由于 JS 中 this 指针的问题，此处只能使用箭头函数进行定义
   * @param event
   */
  public handlePointerUp = (event: PointerEvent) => {
    if (this.isPointerDown) {
      this.isPointerDown = false;
      // todo 移除活跃样式
      this.removeActiveStyle(this.drag.ele);
      this.clone.ele.remove();
    }
  };

  /**
   * 根据点击的 Target 获取 parentElement 下一级的元素
   * @param element
   */
  public getTargetElement(element: HTMLElement) {
    if (element.parentElement == this.parent.nativeElement) {
      return element;
    }
    return this.getTargetElement(element.parentElement);
  }

  /**
   * 移除定时器
   * @param intervalName
   */
  public removeInterval(intervalNames: string[]) {
    intervalNames.forEach(intervalName => {
      // 移除定时器
      clearInterval(this[intervalName]);
      // 将对应定时器的 Id 置空
      this[intervalName] = null;
    });
    // 移除了滚动条定时器后更新 rect
    this.getRect();
  }

  /**
   * 设置 clone 元素的样式
   * @param ele
   */
  public setCloneEleStyle(ele: HTMLElement): void {
    ele.style.zIndex = '2147483647';
    ele.style.position = 'fixed';
    ele.style.left = '0';
    ele.style.top = '0';
    ele.style.opacity = '0.8';
  }

  /**
   * 设置 Active 样式
   * @param ele
   */
  public setActiveStyle(ele: HTMLElement): void {
    ele.style.background = '#C8EBFB';
  }

  /**
   * 去除 Active 样式
   * @param ele
   */
  public removeActiveStyle(ele: HTMLElement): void {
    ele.style.background = null;
  }

}
