import videojs from 'video.js';

interface ContextFromVideo {
    voiceDataUrl: string;
    imgDataUrl: string;
}

class LocalVideo {
    public videoElement: HTMLVideoElement;
    private player: videojs.Player;

    public constructor(videoElement: HTMLVideoElement, player: videojs.Player) {
        this.videoElement = videoElement;
        this.player = player;
    }

    public seek(time: number): void {
        this.player.currentTime(time);
    }
    public play(): void {
        this.player.play();
    }
    public pause(): void {
        this.player.pause();
    }
    public getCurrentTime(): number {
        return this.player.currentTime();
    }
    public setOntimeupdate(f: any): void {
        this.videoElement.ontimeupdate = f;
    }

    // all time unit is second
    public seekAndPlay(time: number | null) {
        if (!time) {
            return;
        }
        this.seek(time);
        this.play();
    }

    public async getContextFromVideo(begin: number, end: number): Promise<ContextFromVideo> {
        let contextFromVideo: ContextFromVideo = {
            voiceDataUrl: '',
            imgDataUrl: ''
        };
        this.pause();
        contextFromVideo.imgDataUrl = this.captureVideo(begin);
        contextFromVideo.voiceDataUrl = await this.captureAudio(begin, end);
        this.pause();
        return contextFromVideo;
    }

    // capture video
    private captureVideo(time: number): string {
        this.seek(time);
        let canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        let ctx = canvas.getContext('2d')!;
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.5);
    }

    private async captureAudio(begin: number, end: number): Promise<string> {
        let videoElement: any = this.videoElement;
        let stream: MediaStream = videoElement.captureStream();

        let audioStream = new MediaStream(stream.getAudioTracks());

        // record audio
        let chunks: Array<Blob> = [];

        const mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
        };
        const timeExtend = 200;
        const duration = (end - begin) * 1000 + timeExtend;
        mediaRecorder.start();
        this.play();
        return new Promise<string>((resolve) => {
            mediaRecorder.onstop = () => {
                let reader = new window.FileReader();
                reader.addEventListener('loadend', () => {
                    let base64 = reader.result?.toString();
                    if (!base64) {
                        base64 = '';
                    }
                    resolve(base64);
                });
                const blob = new Blob(chunks, { type: 'audio/webm' });
                reader.readAsDataURL(blob);
            };
            setTimeout(() => {
                mediaRecorder.stop();
            }, duration);
        });
    }
}

export { LocalVideo };
