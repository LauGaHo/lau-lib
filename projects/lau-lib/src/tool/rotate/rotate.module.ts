import {NgModule} from '@angular/core';
import {RotateComponent} from './rotate.component';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    RotateComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    RotateComponent,
  ]
})
export class RotateModule { }
