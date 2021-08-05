import {DragModule} from './tool/drag/drag.module';
import {NgModule} from '@angular/core';
import {ResizeModule} from './tool/resize/resize.module';
import {RotateModule} from './tool/rotate/rotate.module';

const MODULES = [
  DragModule,
  ResizeModule,
  RotateModule,
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
