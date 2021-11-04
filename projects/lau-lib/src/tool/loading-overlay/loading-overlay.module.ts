import {NgModule} from '@angular/core';
import {LoadingOverlayComponent} from './loading-overlay.component';
import {CommonModule} from '@angular/common';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {NzIconModule} from 'ng-zorro-antd/icon';

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
