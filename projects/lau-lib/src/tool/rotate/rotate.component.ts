import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from "@angular/core";
import {fromEvent} from "rxjs";
import {concatAll, map, merge, take, takeUntil} from "rxjs/operators";

@Component({
  selector: "tool-rotate",
  templateUrl: "./rotate.component.html",
  styleUrls: [
    "./rotate.component.css"
  ]
})

export class RotateComponent implements OnInit {

  constructor(
    private ngZone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(this.subscribe);
  }

  @ViewChild("rotateHandle", {static: true}) private rotateHandle: ElementRef<HTMLDivElement>;

  @Input() public selected: boolean;
  @Input() public rotatable: boolean = true;
  @Input() public rotateEle: HTMLElement;
  @Input() public rotateMoving: (deg: number) => void;
  @Input() public rotateEnd: () => void;

  /**
   * 订阅 mousedown、mousemove、mouseup 事件，并且进行对应处理
   */
  private subscribe = () => {
    const mousedown = fromEvent(this.rotateHandle.nativeElement, "mousedown");
    const mousemove = fromEvent(document, "mousemove");
    const mouseup = fromEvent(document, "mouseup");

    let startX: number;
    let startY: number;
    let rect: any;
    let centerX: number;
    let centerY: number;

    const observable = mousedown.pipe(
      map((event: MouseEvent) => {
        // 避免事件冒泡到外层导致 dragging 逻辑错误触发
        event.stopPropagation();
        event.preventDefault();

        startX = event.clientX;
        startY = event.clientY;
        rect = this.rotateEle.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;

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

      switch (e.type) {

        case "mousemove":
          const curX = e.clientX;
          const curY = e.clientY;
          const rotateDegreeBefore = Math.atan2(startY - centerY, startX - centerX) / (Math.PI / 180);
          const rotateDegreeAfter = Math.atan2(curY - centerY, curX - centerX) / (Math.PI / 180);
          startX = curX;
          startY = curY;
          const rotateDegree = rotateDegreeAfter - rotateDegreeBefore;
          this.rotateMoving(rotateDegree);
          break;

        case "mouseup":
          this.rotateEnd();
          break;

      }

    })
  }

}
