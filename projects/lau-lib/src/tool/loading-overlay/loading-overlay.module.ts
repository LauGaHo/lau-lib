import {NgModule} from '@angular/core';
import {LoadingOverlayComponent} from './loading-overlay.component';
import {CommonModule} from '@angular/common';
import {NzIconModule, NzSpinModule} from 'ng-zorro-antd';

@NgModule({
  declarations: [
    LoadingOverlayComponent,
  ],
  imports: [
    CommonModule,
    NzSpinModule,
    NzIconModule
  ],
  exports: [
    LoadingOverlayComponent,
  ]
})
export class LoadingOverlayModule { }
