import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from "@angular/core";
import MathUtils from "./utils/math-utils";
import GeometryUtils from "./utils/geometry-utils";
import {fromEvent} from "rxjs";
import {concatAll, map, merge, mergeAll, take, takeUntil, throttleTime} from "rxjs/operators";

@Component({
  selector: "tool-resize",
  templateUrl: "./resize.component.html",
  styleUrls: [
    "./resize.component.less"
  ]
})

export class ResizeComponent implements OnInit {

  constructor(
    private ngZone: NgZone
  ) {
  }

  @ViewChild('nResize', {static: true}) private nResize: ElementRef<HTMLDivElement>;
  @ViewChild('sResize', {static: true}) private sResize: ElementRef<HTMLDivElement>;
  @ViewChild('wResize', {static: true}) private wResize: ElementRef<HTMLDivElement>;
  @ViewChild('eResize', {static: true}) private eResize: ElementRef<HTMLDivElement>;
  @ViewChild('nwResize', {static: true}) private nwResize: ElementRef<HTMLDivElement>;
  @ViewChild('swResize', {static: true}) private swResize: ElementRef<HTMLDivElement>;
  @ViewChild('neResize', {static: true}) private neResize: ElementRef<HTMLDivElement>;
  @ViewChild('seResize', {static: true}) private seResize: ElementRef<HTMLDivElement>;

  // 宿主元素对缩放后的位置和大小处理的箭头函数
  @Input() public resizeMoving: (position: { x: number, y: number }, size: { width: number, height: number }) => void;
  // 缩放结束后的箭头函数
  @Input() public resizeEnd: () => void;
  // selected 为 true 才显示对应的小方块，selected 为 false 不显示对应小方块
  @Input() public selected: boolean;
  // 每个缩放小方块对应的标识
  @Input() public positions: string[];
  // 是否允许拖拽缩放
  @Input() public resizable: boolean = true;
  // 拖拽放大的宿主元素
  @Input() public resizeElement: HTMLElement;
  // Element 所在的画布元素，例如：page-config-panel中的 div
  @Input() public canvasElement: HTMLElement;

  // cursor和对应的角度范围
  private angleToCursor: any[] = [
    { start: 338, end: 23, cursor: 'nw-resize' },
    { start: 23, end: 68, cursor: 'n-resize' },
    { start: 68, end: 113, cursor: 'ne-resize' },
    { start: 113, end: 158, cursor: 'e-resize' },
    { start: 158, end: 203, cursor: 'se-resize' },
    { start: 203, end: 248, cursor: 's-resize' },
    { start: 248, end: 293, cursor: 'sw-resize' },
    { start: 293, end: 338, cursor: 'w-resize' },
  ];
  // 拖曳缩放元素列表
  private elementInfos: {element: HTMLElement, position: string}[];
  // 小方框实体跟其初始角度的一个Map
  private initResizeToAngle: Map<ElementRef<HTMLDivElement>, number>;

  /**
   * Resize逻辑放在NgZone之外，防止频繁触发Angular的变更检测
   */
  ngOnInit(): void {
    // 在ngZone之外绑定事件
    this.ngZone.runOutsideAngular(() => {
      this.elementInfos = [
        {element: this.nResize.nativeElement, position: 'n'},
        {element: this.sResize.nativeElement, position: 's'},
        {element: this.wResize.nativeElement, position: 'w'},
        {element: this.eResize.nativeElement, position: 'e'},
        {element: this.nwResize.nativeElement, position: 'nw'},
        {element: this.neResize.nativeElement, position: 'ne'},
        {element: this.swResize.nativeElement, position: 'sw'},
        {element: this.seResize.nativeElement, position: 'se'},
      ]

      this.subscribe(this.elementInfos)
    });

    // 初始化小方框和其对应的初始角度
    this.initResizeToAngle = new Map([
      [this.nwResize, 0],
      [this.nResize, 45],
      [this.neResize, 90],
      [this.eResize, 135],
      [this.seResize, 180],
      [this.sResize, 225],
      [this.swResize, 270],
      [this.wResize, 315],
    ]);
  }

  /**
   * 根据传入元素旋转的角度，对应调整每个 Handle 的 cursor 的指向
   * @param rotate
   */
  public adjustCursorAngle: (rotate: number) => void = (rotate: number) => {
    // 根据元素是否有旋转角度，来调整每个 Handle 对应 cursor 的方向
    this.initResizeToAngle.forEach((value, key) => {
      const angle = (rotate + 360 + value) % 360;
      for (let angleCursor of this.angleToCursor) {
        if (angle < 23 || angle >= 338) {
          key.nativeElement.style.cursor = angleCursor.cursor;
          break;
        }

        if (angleCursor.start <= angle && angle < angleCursor.end) {
          key.nativeElement.style.cursor = angleCursor.cursor;
          break;
        }
      }
    });
  }

  /**
   * 元素订阅事件函数
   * @param elementInfos
   */
  private subscribe = (elementInfos: {element: HTMLElement, position: string}[]) => {
    for (let elementInfo of elementInfos) {
      const mousedown = fromEvent(elementInfo.element, "mousedown");
      const mousemove = fromEvent(document, "mousemove");
      const mouseup = fromEvent(document, "mouseup");

      let rect: any;
      let canvasRect: any;
      let center: {x: number, y: number};
      let curPoint: {x: number, y: number};
      let symmetricPoint: {x: number, y: number};
      let proportion: number;
      let rotate: number;

      const observable = mousedown.pipe(
        map((e: MouseEvent) => {
          // 避免事件冒泡到外层导致 dragging 逻辑错误触发
          e.stopPropagation();
          e.preventDefault();

          rect = this.resizeElement.getBoundingClientRect();
          // 获取画布
          canvasRect = this.canvasElement.getBoundingClientRect();
          // 获取元素中心点
          center = {
            x: (rect.left + rect.width / 2) - canvasRect.left,
            y: (rect.top + rect.height / 2) - canvasRect.top,
          };
          // 当前点击的坐标
          curPoint = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top,
          };
          // 获取对称点坐标
          symmetricPoint = {
            x: center.x - (curPoint.x - center.x),
            y: center.y - (curPoint.y - center.y),
          }
          // 获取对应Element的长宽比例
          proportion = this.resizeElement.offsetWidth / this.resizeElement.offsetHeight;
          // 获取旋转角度
          const transform: string = this.resizeElement.style.transform;
          let regExp = /(-)?[0-9]+([.][0-9]+)?(deg)/g;
          if (regExp.test(transform)) {
            rotate = parseFloat(transform.match(regExp)[0]);
          }

          return mousemove.pipe(
            takeUntil(mouseup),
            merge(mouseup.pipe(
              take(1)
            )),
          );

        }),
        concatAll(),
      );

      observable.subscribe((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        switch (e.type) {

          case "mousemove":
            const curPosition = {
              x: e.clientX - canvasRect.left,
              y: e.clientY - canvasRect.top,
            };

            const pointInfo = {
              symmetricPoint: symmetricPoint,
              center: center,
              curPoint: curPoint
            };

            this.func[elementInfo.position](rotate, curPosition, proportion, pointInfo, this.resizeMoving);

          case "mouseup":
            this.resizeEnd();

        }
      });

    }
  }

  /**
   * 拖拽左上角
   * @param rotate 旋转的角度
   * @param curPosition MouseMove产生的位置
   * @param proportion Element对应的比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateLeftTop = (rotate: number,
                             curPosition: { x: number, y: number },
                             proportion: number,
                             pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                             callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint} = pointInfo;

    // 获取即时的中心点、top、left、right、bottom
    let newCenterPoint = GeometryUtils.getCenterPoint(curPosition, symmetricPoint);
    let newTopLeftPoint = MathUtils.calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);
    let newBottomRightPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

    // 获取最新的width、height
    let newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
    let newHeight = newBottomRightPoint.y - newTopLeftPoint.y;

    // 等比例缩放
    {
      if (newWidth / newHeight > proportion) {
        newTopLeftPoint.x += Math.abs(newWidth - newHeight * proportion);
      } else {
        newTopLeftPoint.y += Math.abs(newHeight - newWidth / proportion);
      }

      // 由于现在求的未旋转前的坐标是没有按比例缩放宽高的坐标计算的
      // 所以缩减宽高后，需要按照原来的中心点旋转回去，获取缩减宽高并旋转后对应的坐标
      // 然后以这个坐标和对称点获取新的中心点，并重新计算未旋转前的坐标
      const rotatedTopLeftPoint = MathUtils.calculateRotatedPointCoordinate(newTopLeftPoint, newCenterPoint, rotate);
      newCenterPoint = GeometryUtils.getCenterPoint(rotatedTopLeftPoint, symmetricPoint)
      newTopLeftPoint = MathUtils.calculateRotatedPointCoordinate(rotatedTopLeftPoint, newCenterPoint, -rotate);
      newBottomRightPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

      newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
      newHeight = newBottomRightPoint.y - newTopLeftPoint.y;
    }

    callback({x: newTopLeftPoint.x, y: newTopLeftPoint.y}, {width: newWidth, height: newHeight});

  }

  /**
   * 拖拽右上角
   * @param rotate 旋转角度
   * @param curPosition MouseMove产生的位置
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateRightTop = (rotate: number,
                              curPosition: { x: number, y: number },
                              proportion: number,
                              pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                              callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint} = pointInfo;
    let newCenterPoint = GeometryUtils.getCenterPoint(curPosition, symmetricPoint);
    let newTopRightPoint = MathUtils.calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);
    let newBottomLeftPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

    let newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
    let newHeight = newBottomLeftPoint.y - newTopRightPoint.y;

    {
      if (newWidth / newHeight > proportion) {
        newTopRightPoint.x -= Math.abs(newWidth - newHeight * proportion);
      } else {
        newTopRightPoint.y += Math.abs(newHeight - newWidth / proportion);
      }

      const rotatedTopRightPoint = MathUtils.calculateRotatedPointCoordinate(newTopRightPoint, newCenterPoint, rotate);
      newCenterPoint = GeometryUtils.getCenterPoint(rotatedTopRightPoint, symmetricPoint);
      newTopRightPoint = MathUtils.calculateRotatedPointCoordinate(rotatedTopRightPoint, newCenterPoint, -rotate);
      newBottomLeftPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);

      newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
      newHeight = newBottomLeftPoint.y - newTopRightPoint.y;
    }

    callback({x: newBottomLeftPoint.x, y: newTopRightPoint.y}, {width: newWidth, height: newHeight});
  }

  /**
   * 拖拽右下角
   * @param rotate 旋转角度
   * @param curPosition MouseMove产生的位置
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateRightBottom = (rotate: number,
                                 curPosition: { x: number, y: number },
                                 proportion: number,
                                 pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                                 callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint} = pointInfo;
    let newCenterPoint = GeometryUtils.getCenterPoint(curPosition, symmetricPoint);
    let newTopLeftPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
    let newBottomRightPoint = MathUtils.calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);

    let newWidth = newBottomRightPoint.x - newTopLeftPoint.x;
    let newHeight = newBottomRightPoint.y - newTopLeftPoint.y;

    {
      if (newWidth / newHeight > proportion) {
        newBottomRightPoint.x -= Math.abs(newWidth - newHeight * proportion)
      } else {
        newBottomRightPoint.y -= Math.abs(newHeight - newWidth / proportion)
      }

      const rotatedBottomRightPoint = MathUtils.calculateRotatedPointCoordinate(newBottomRightPoint, newCenterPoint, rotate)
      newCenterPoint = GeometryUtils.getCenterPoint(rotatedBottomRightPoint, symmetricPoint)
      newTopLeftPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate)
      newBottomRightPoint = MathUtils.calculateRotatedPointCoordinate(rotatedBottomRightPoint, newCenterPoint, -rotate)

      newWidth = newBottomRightPoint.x - newTopLeftPoint.x
      newHeight = newBottomRightPoint.y - newTopLeftPoint.y
    }

    callback({x: newTopLeftPoint.x, y: newTopLeftPoint.y}, {width: newWidth, height: newHeight});
  }

  /**
   * 拖拽左下角
   * @param rotate 旋转角度
   * @param curPosition MouseMove产生的位置
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateLeftBottom = (rotate: number,
                                curPosition: { x: number, y: number },
                                proportion: number,
                                pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                                callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint} = pointInfo;
    let newCenterPoint = GeometryUtils.getCenterPoint(curPosition, symmetricPoint);
    let newTopRightPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
    let newBottomLeftPoint = MathUtils.calculateRotatedPointCoordinate(curPosition, newCenterPoint, -rotate);

    let newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
    let newHeight = newBottomLeftPoint.y - newTopRightPoint.y;

    {
      if (newWidth / newHeight > proportion) {
        newBottomLeftPoint.x += Math.abs(newWidth - newHeight * proportion);
      } else {
        newBottomLeftPoint.y -= Math.abs(newHeight - newWidth / proportion);
      }

      const rotatedBottomLeftPoint = MathUtils.calculateRotatedPointCoordinate(newBottomLeftPoint, newCenterPoint, rotate);
      newCenterPoint = GeometryUtils.getCenterPoint(rotatedBottomLeftPoint, symmetricPoint);
      newTopRightPoint = MathUtils.calculateRotatedPointCoordinate(symmetricPoint, newCenterPoint, -rotate);
      newBottomLeftPoint = MathUtils.calculateRotatedPointCoordinate(rotatedBottomLeftPoint, newCenterPoint, -rotate);

      newWidth = newTopRightPoint.x - newBottomLeftPoint.x;
      newHeight = newBottomLeftPoint.y - newTopRightPoint.y;
    }

    callback({x: newBottomLeftPoint.x, y: newTopRightPoint.y}, {width: newWidth, height: newHeight});
  }

  /**
   * 拖拽正上方
   * @param rotate 旋转的角度
   * @param curPosition MouseMove的位置信息
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateTop = (rotate: number,
                         curPosition: { x: number, y: number },
                         proportion: number,
                         pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                         callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint, curPoint} = pointInfo
    let rotatedCurPosition = MathUtils.calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
    let rotatedTopMiddlePoint = MathUtils.calculateRotatedPointCoordinate({
      x: curPoint.x,
      y: rotatedCurPosition.y,
    }, curPoint, rotate);

    // 勾股定理
    let newHeight = Math.sqrt((rotatedTopMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedTopMiddlePoint.y - symmetricPoint.y) ** 2);

    if (newHeight > 0) {
      const newCenter = {
        x: rotatedTopMiddlePoint.x - (rotatedTopMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedTopMiddlePoint.y + (symmetricPoint.y - rotatedTopMiddlePoint.y) / 2,
      };

      let newWidth = this.resizeElement.offsetWidth;

      callback({
        x: Math.round(newCenter.x - (newWidth / 2)),
        y: Math.round(newCenter.y - (newHeight / 2))
      }, {width: newWidth, height: newHeight});
    }
  }

  /**
   * 拖拽右方
   * @param rotate 旋转的角度
   * @param curPosition MouseMove的位置信息
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateRight = (rotate: number,
                           curPosition: { x: number, y: number },
                           proportion: number,
                           pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                           callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint, curPoint} = pointInfo;
    const rotatedCurPosition = MathUtils.calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
    const rotatedRightMiddlePoint = MathUtils.calculateRotatedPointCoordinate({
      x: rotatedCurPosition.x,
      y: curPoint.y,
    }, curPoint, rotate);

    let newWidth = Math.sqrt((rotatedRightMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedRightMiddlePoint.y - symmetricPoint.y) ** 2);
    if (newWidth > 0) {
      const newCenter = {
        x: rotatedRightMiddlePoint.x - (rotatedRightMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedRightMiddlePoint.y + (symmetricPoint.y - rotatedRightMiddlePoint.y) / 2,
      };

      let newHeight = this.resizeElement.offsetHeight;

      callback({
        x: Math.round(newCenter.x - (newWidth / 2)),
        y: Math.round(newCenter.y - (newHeight / 2))
      }, {width: newWidth, height: newHeight});
    }
  }

  /**
   * 拖拽下方
   * @param rotate 旋转的角度
   * @param curPosition MouseMove的位置信息
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateBottom = (rotate: number,
                            curPosition: { x: number, y: number },
                            proportion: number,
                            pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                            callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint, curPoint} = pointInfo;
    const rotatedCurPosition = MathUtils.calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
    const rotatedBottomMiddlePoint = MathUtils.calculateRotatedPointCoordinate({
      x: curPoint.x,
      y: rotatedCurPosition.y,
    }, curPoint, rotate);

    const newHeight = Math.sqrt((rotatedBottomMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedBottomMiddlePoint.y - symmetricPoint.y) ** 2);
    if (newHeight > 0) {
      const newCenter = {
        x: rotatedBottomMiddlePoint.x - (rotatedBottomMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedBottomMiddlePoint.y + (symmetricPoint.y - rotatedBottomMiddlePoint.y) / 2,
      };

      let newWidth = this.resizeElement.offsetWidth;

      callback({
        x: Math.round(newCenter.x - (newWidth / 2)),
        y: Math.round(newCenter.y - (newHeight / 2))
      }, {width: newWidth, height: newHeight});
    }
  }

  /**
   * 拖拽左方
   * @param rotate 旋转的角度
   * @param curPosition MouseMove的位置信息
   * @param proportion 缩放比例
   * @param pointInfo 当中包含symmetricPoint(对称点位置)、center(中点位置)、curPoint(MouseDown点击的位置)
   * @param callback 将计算完的值进行设置的回调函数
   */
  private calculateLeft = (rotate: number,
                          curPosition: { x: number, y: number },
                          proportion: number,
                          pointInfo: { symmetricPoint: any, center: any, curPoint: any },
                          callback: (position: { x: number, y: number }, size: { width: number, height: number }) => void) => {
    const {symmetricPoint, curPoint} = pointInfo
    const rotatedCurPosition = MathUtils.calculateRotatedPointCoordinate(curPosition, curPoint, -rotate);
    const rotatedLeftMiddlePoint = MathUtils.calculateRotatedPointCoordinate({
      x: rotatedCurPosition.x,
      y: curPoint.y,
    }, curPoint, rotate);

    const newWidth = Math.sqrt((rotatedLeftMiddlePoint.x - symmetricPoint.x) ** 2 + (rotatedLeftMiddlePoint.y - symmetricPoint.y) ** 2);
    if (newWidth > 0) {
      const newCenter = {
        x: rotatedLeftMiddlePoint.x - (rotatedLeftMiddlePoint.x - symmetricPoint.x) / 2,
        y: rotatedLeftMiddlePoint.y + (symmetricPoint.y - rotatedLeftMiddlePoint.y) / 2,
      };

      let newHeight = this.resizeElement.offsetHeight;

      callback({
        x: Math.round(newCenter.x - (newWidth / 2)),
        y: Math.round(newCenter.y - (newHeight / 2))
      }, {width: newWidth, height: newHeight});
    }
  }

  private func = {
    n: this.calculateTop,
    s: this.calculateBottom,
    w: this.calculateLeft,
    e: this.calculateRight,
    nw: this.calculateLeftTop,
    ne: this.calculateRightTop,
    sw: this.calculateLeftBottom,
    se: this.calculateRightBottom,
  }

}
