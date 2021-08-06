# LauLib

## DragComponent

`DragComponent` 是用于 `DOM` 元素的拖曳的一个组件，`DragComponent` 的定义的 API 如下

```typescript
export declare class DragComponent implements OnInit {
    private ngZone;
    constructor(ngZone: NgZone);
    draggable: boolean;
    // Input 属性：是否需要展示方形四边的拖曳手柄，如设置了 contentEditable 的元素需要拖曳手柄
    showHandle: boolean;
    // Input 属性：当 showHandle 为 true 时，selected 绑定元素是否被选中，选中才显示 handle
    selected: boolean;
    // Input 属性：拖曳进行中的回调函数
    dragMoving: (deltaX: number, deltaY: number) => void;
    // Input 属性：拖曳结束后的回调函数
    dragEnd: () => void;
    // Input 属性：表示需要拖曳的元素
    dragElement: HTMLElement;
    // Output 属性：点击 Handle 向外发射事件
    clickHandle: EventEmitter<any>;
    /**
     * 由于元素的拖动没有必要触发Angular全局的变更检测
     * 所以将元素拖拽相关代码放在ngZone之外运行
     */
    ngOnInit(): void;
}
```

应用例子 (不使用 Handle ) 如下

```html
// element.component.html

<div #divElement 
     [style.transform]="scaledTransform">
  <tool-drag #dragComponent
             [draggable]="draggable"
             [selected]="selected"
             [dragElement]="divElement"
             [dragMoving]="dragMoving"
             [dragEnd]="dragEnd"></tool-drag>
</div>
```

```typescript
// element.component.ts

export class ElementComponent {
  
  @ViewChild('divElement', {static: true}) divElement: ElementRef<HTMLDivElement>;
  
  ...
  
  public dragMoving = (deltaX: number, deltaY: number) => {
    // 赋值
    this.position.x += deltaX;
    this.position.y += deltaY;
    this.divElement.nativeElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
  }

  public dragEnd = () => {
    ...
  }
}
```

应用例子 (  使用 Handle ) 如下

```html
// element.component.html

<div #divElement 
     [style.transform]="scaledTransform">
  <tool-drag #dragComponent
             [draggable]="draggable"
             [dragMoving]="dragMoving"
             [dragEnd]="dragEnd"
             [showHandle]="true"
             [selected]="selected"
             (clickHandle)="dragHandleClick($event)"></tool-drag>
</div>
```

```typescript
// element.component.ts

export class ElementComponent {
  
  @ViewChild('divElement', {static: true}) divElement: ElementRef<HTMLDivElement>;
  
  public dragMoving = (deltaX: number, deltaY: number) => {
    // 赋值
    this.position.x += deltaX;
    this.position.y += deltaY;
    this.divElement.nativeElement.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
  }

  public dragEnd = () => {
    ...
  }
  
}
```

## ResizeComponent

`ResizeComponent` 主要用于实现拖曳元素进行元素大小的缩放，对应的 API 如下

```typescript
export declare class ResizeComponent implements OnInit {
    private ngZone;
    constructor(ngZone: NgZone);
    // Input 属性：缩放过程的箭头函数，用于扩展功能
    resizeMoving: (position: {
        x: number;
        y: number;
    }, size: {
        width: number;
        height: number;
    }) => void;
    // Input 属性：缩放结束的箭头函数，用于扩展功能
    resizeEnd: () => void;
    // Input 属性：元素是否选中，选中才显示手柄
    selected: boolean;
    // Input 属性：需要展示手柄的名称数组
    positions: string[];
    // Input 属性：是否允许拖曳缩放
    resizable: boolean;
    // Input 属性：进行拖曳缩放的元素
    resizeElement: HTMLElement;
    // Input 属性：进行拖曳缩放的元素所在的容器元素
    canvasElement: HTMLElement;
    /**
     * Resize逻辑放在NgZone之外，防止频繁触发Angular的变更检测
     */
    ngOnInit(): void;
    /**
     * 可供调用 API，根据元素旋转角度调整各个 cursor 的指向
     */
    adjustCursorAngle: (rotate: number) => void;
}
```

应用例子

```html
<div #divElement 
     [style.width]="offsetWidth"
     [style.height]="offsetHeight">
  <tool-resize #resizeComponent
               [resizable]="resizable"
               [positions]="['n', 's', 'w', 'e', 'nw', 'sw', 'ne', 'se']"
               [resizeMoving]="resizeMoving"
               [resizeEnd]="resizeEnd"
               [selected]="selected"
               [resizeElement]="divElement"
               [canvasElement]="containerElement"></tool-resize>
</div>
```

```typescript
export class ElementComponent {
  
  @ViewChild('divElement', {static: true}) divElement: ElementRef<HTMLDivElement>;
  
  public resizeMoving = (position: { x: number, y: number }, size: { width: number, height: number }) => {
    // 设置元素对应的位置，长宽
    this.offset.width = `${size.width}px`;
    this.offset.height = `${size.height}px`;
    this.divElement.nativeElement.style.width = this.offset.width;
    this.divElement.nativeElement.style.height = this.offset.height;
  }
  
  public resizeEnd = () => {
    ......
  }
  
}
```

## RotateComponent

`RotateComponent` 对应实现了 `DOM` 元素的旋转，对应的 API 如下

```typescript
export declare class RotateComponent implements OnInit {
    private ngZone;
    constructor(ngZone: NgZone);
    ngOnInit(): void;
    // Input 属性
    selected: boolean;
    // Input 属性
    rotatable: boolean;
    // Input 属性
    rotateEle: HTMLElement;
    // Input 属性
    rotateMoving: (deg: number) => void;
    // Input 属性
    rotateEnd: () => void;
}
```

示例如下

```html
<div #divElement 
     [style.transform]="scaledTransform">
  <tool-rotate #rotateComponent
               [selected]="selected"
               [rotatable]="rotatable"
               [rotateEle]="divElement"
               [rotateMoving]="rotateMoving"
               [rotateEnd]="rotateEnd"></tool-rotate>
</div>
```

```typescript
export class RotateComponent {
  
  @ViewChild('divElement', {static: true}) divElement: ElementRef<HTMLDivElement>;
  
  ......
  
  public rotateMoving = (deg: number) => {
    this.rotate = this.rotate + deg;
    this.divElement.nativeElement.style.transform = `rotate(${this.rotate}deg)`;
  }
  
  public rotateEnd = () => {
    ......
  }
  
}
```



