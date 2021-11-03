import {Component, Input} from '@angular/core';

@Component({
  selector: 'tool-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.css']
})
export class LoadingOverlayComponent {

  @Input() info: string = '加载中';
  @Input() zIndex: number = 2147483647;
  @Input() color: string = '#FFFFFF';
  @Input() bgColor: string = '#06164d';
  @Input() infoSize: number = 40;
  @Input() status: LoadingOverlayStatus = 'loading';

}

export type LoadingOverlayStatus = 'loading' | 'success' | 'failed' | 'info';
