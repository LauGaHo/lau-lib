import {NgModule} from '@angular/core';
import {ResizeComponent} from './resize.component';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    ResizeComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ResizeComponent,
  ]
})
export class ResizeModule { }
