import {DragModule} from './tool/drag/drag.module';
import {NgModule} from '@angular/core';
import {ResizeModule} from './tool/resize/resize.module';
import {RotateModule} from './tool/rotate/rotate.module';
import {LoadingOverlayModule} from './tool/loading-overlay/loading-overlay.module';
import {DragSortModule} from './directive/drag-sort/drag-sort.module';

const MODULES = [
  DragModule,
  ResizeModule,
  RotateModule,
  LoadingOverlayModule,
  DragSortModule
];

@NgModule({
  declarations: [],
  imports: [
    MODULES,
  ],
  exports: [
    MODULES,
  ]
})
export class LauLibModule { }
