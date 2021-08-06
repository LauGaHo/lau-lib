import {NgModule} from '@angular/core';
import {RotateComponent} from './rotate.component';
import {CommonModule} from '@angular/common';
import {NzIconModule} from 'ng-zorro-antd';

@NgModule({
  declarations: [
    RotateComponent,
  ],
    imports: [
        CommonModule,
        NzIconModule,
    ],
  exports: [
    RotateComponent,
  ]
})
export class RotateModule { }
