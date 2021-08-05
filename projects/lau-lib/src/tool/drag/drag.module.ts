import {NgModule} from '@angular/core';
import {DragComponent} from './drag.component';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    DragComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    DragComponent,
  ]
})
export class DragModule { }

