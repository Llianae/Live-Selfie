import {
  Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit
} from "@angular/core";
import {NgIf} from "@angular/common";

@Component({
  selector: "app-video-capture",
  standalone: true,
  templateUrl: "./video-capture.component.html",
  styleUrls: ["./video-capture.component.scss"],
  imports: [
    NgIf
  ]
})
export class VideoCaptureComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("preview", { static: true }) preview: ElementRef<HTMLVideoElement> | undefined;
  @ViewChild("recording", { static: true })
  recording: ElementRef<HTMLVideoElement> | undefined;

  selfieStatus: boolean = true;
  isSuccessed: boolean = false;
  stopStart: boolean = true;
  isRecording: boolean = true;
  recordingTimeMS: number = 4000;
  capturedFile: File | null = null;
  stream: any;

  constructor() {}

  ngOnInit(): void {
    console.log('Composant de capture vidéo initialisé');
    this.isRecording = true;
    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngAfterViewInit() {
    console.log('Éléments DOM accessibles:', this.preview, this.recording);
  }

  ngOnDestroy(): void {
    this.stopStream();
    this.capturedFile = null;
    this.stream = null;
  }

  log(msg: any) {
    console.log(msg);
  }

  wait(delayInMS: number | undefined) {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
  }

  startRecording(stream: MediaStream, lengthInMS: number | undefined) {
    let recorder = new MediaRecorder(stream);
    let data: any[] | PromiseLike<any[]> = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event);
    });

    let recorded = this.wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([stopped, recorded]).then(() => data);
  }

  stop(stream: MediaProvider | null) {
    if (stream != null && "getTracks" in stream && stream.getTracks != null) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  startStream() {
    console.log('Démarrage du flux vidéo');
    this.isRecording = true;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (this.preview && this.preview.nativeElement) {

          this.stream = stream;
          this.preview.nativeElement.srcObject = stream;
          (this.preview.nativeElement as any).captureStream =
            (this.preview.nativeElement as any).captureStream ||
            (this.preview.nativeElement as any).mozCaptureStream;
          return new Promise((resolve, reject) => {
            if (this.preview && this.preview.nativeElement) {

              this.preview.nativeElement.onplaying = resolve;
              this.preview.nativeElement.onerror = (event) => reject(event);
            }
          });
        } else {return null}
      })
      .then(() => {
        if (
          navigator.userAgent.search("Safari") >= 0 &&
          navigator.userAgent.search("Chrome") < 0
        ) {
          return this.startRecording(
            new MediaStream(this.stream),
            this.recordingTimeMS
          );
        } else {
          if (this.preview && this.preview.nativeElement) {

            return this.startRecording(
              (this.preview.nativeElement as any).captureStream(),
              this.recordingTimeMS
            );
          } else {
            return null}
        }
      })
      .then((recordedChunks) => {
        this.isRecording = false;
        if(!recordedChunks) {
          throw new Error('blob')
        }
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
        if (this.recording && this.recording.nativeElement) {
          this.recording.nativeElement.src = URL.createObjectURL(recordedBlob);
        }
        this.capturedFile = new File([recordedBlob], "RecordedVideo.mp4", {
          type: "video/mp4",
          lastModified: Date.now(),
        });
        this.stopStream();
      })
      .catch(this.log);
  }

  stopStream() {
    if (this.preview && this.preview.nativeElement) {
      this.stop(this.preview.nativeElement.srcObject);
    }
  }

  sendData() {
    if (this.capturedFile != null) {
      console.log("Vidéo capturée:", this.capturedFile);
      alert("Vidéo capturée avec succès!");
      this.isSuccessed = true;
    } else {
      console.error("Erreur: aucune vidéo capturée");
      alert("Erreur: aucune vidéo capturée");
    }

    this.stopStream();
  }

  stopStartClick() {
    if (this.stopStart) {
      this.startStream();
      this.stopStart = false;
    } else {
      this.stopStream();
      this.stopStart = true;
    }
  }
}
