import {Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild} from "@angular/core";
import {concatAll, map, merge, take, takeUntil} from "rxjs/operators";
import {fromEvent} from "rxjs";

@Component({
  selector: "tool-drag",
  templateUrl: "./drag.component.html",
  styleUrls: [
    "./drag.component.less"
  ]
})

export class DragComponent implements OnInit {

  constructor(
    private ngZone: NgZone
  ) {

  }

  @ViewChild('nDrag', {static: true}) private nDrag: ElementRef<HTMLDivElement>;
  @ViewChild('sDrag', {static: true}) private sDrag: ElementRef<HTMLDivElement>;
  @ViewChild('wDrag', {static: true}) private wDrag: ElementRef<HTMLDivElement>;
  @ViewChild('eDrag', {static: true}) private eDrag: ElementRef<HTMLDivElement>;

  @Input() public draggable: boolean = true;
  @Input() public showHandle: boolean = false;
  @Input() public selected: boolean;
  @Input() public dragMoving: (deltaX: number, deltaY: number) => void;
  @Input() public dragEnd: () => void;
  @Input() public dragElement: HTMLElement;

  @Output() public clickHandle: EventEmitter<any> = new EventEmitter<any>();

  /**
   * 由于元素的拖动没有必要触发Angular全局的变更检测
   * 所以将元素拖拽相关代码放在ngZone之外运行
   */
  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      if (!this.showHandle) {
        this.subscribe([this.dragElement]);
      } else {
        this.subscribe([this.nDrag.nativeElement, this.sDrag.nativeElement, this.wDrag.nativeElement, this.eDrag.nativeElement]);
      }
    });
  }

  /**
   * 元素的事件流订阅
   * @param elements
   */
  private subscribe = (elements: HTMLElement[]) => {
    if (!this.draggable) return;
    for (let element of elements) {
      const mousedown = fromEvent(element, "mousedown");
      const mousemove = fromEvent(document, "mousemove");
      const mouseup = fromEvent(document, "mouseup");

      let position: { x: number, y: number };

      const observable = mousedown.pipe(
        map((e: MouseEvent) => {
          position = {x: e.clientX, y: e.clientY};
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
            const deltaX = e.clientX - position.x;
            const deltaY = e.clientY - position.y;
            position.x = e.clientX;
            position.y = e.clientY;
            this.dragMoving(deltaX, deltaY);
            break;

          case "mouseup":
            this.dragEnd();
            break;

        }
      })
    }
  }

}
