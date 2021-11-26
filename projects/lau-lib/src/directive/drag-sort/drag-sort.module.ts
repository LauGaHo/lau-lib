import {NgModule} from '@angular/core';
import {DragSortDirective} from './drag-sort.directive';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    DragSortDirective,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    DragSortDirective,
  ]
})
export class DragSortModule { }
