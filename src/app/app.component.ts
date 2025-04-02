import { Component } from '@angular/core';
import {VideoCaptureComponent} from "./video-capture/video-capture.component";

@Component({
  selector: 'app-root',
  imports: [VideoCaptureComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'live-selfie';
}
