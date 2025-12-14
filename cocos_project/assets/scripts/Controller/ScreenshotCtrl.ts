import {
    _decorator, Node, Component, Camera, RenderTexture, ImageAsset,
    view, Texture2D, SpriteFrame, Sprite, sys, native
} from 'cc';
import { HarmonySDK } from '../Wrappers/Harmony/HarmonyNativeSDK';

const { ccclass, property } = _decorator;

// Capture configuration
const SCALE = 1;
const CAPTURE_SIZE = [1280 * SCALE, 720 * SCALE] as [number, number];

@ccclass('ScreenshotCtrl')
export class ScreenshotCtrl extends Component {

    @property(Node)
    screenshotNode: Node = null;

    @property({ type: Camera })
    cam: Camera = null;

    @property({ type: Sprite })
    screenSP: Sprite = null;

    private rt: RenderTexture = null;
    private _buffer: Uint8Array = null;
    private _size: [number, number] = [0, 0];
    private _filePath: string = null;
    private _captureSize: [number, number] = [...CAPTURE_SIZE];

    get buffer(): Uint8Array {
        return this._buffer;
    }

    get captureSize(): string {
        return `${this._captureSize[0]},${this._captureSize[1]}`;
    }

    start() {
        this.cam.enabled = false;
    }

    async showScreenshot() {
        await this.takeScreenshot();
        this.screenshotNode.active = true;
        await this.saveToNative();
    }

    closeScreenshot() {
        this.screenshotNode.active = false;
        this.cleanSpriteFrame(this.screenSP);
        this.deleteTemp();
    }

    saveToGallery() {
        HarmonySDK.saveToGallery(this._filePath);
    }

    startGesture() {
        this.endKnock();
        this.endGesture();
        HarmonySDK.startGestureShare(this._filePath);
    }

    endGesture() {
        HarmonySDK.endGestureShare();
    }
    startKnock() {
        this.endKnock();
        this.endGesture();
        HarmonySDK.startKnockShare(this._filePath);
    }

    endKnock() {
        HarmonySDK.endKnockShare();
    }

    deleteTemp() {
        HarmonySDK.deleteTempFile();
    }

    // Capture screenshot and display
    async takeScreenshot(): Promise<boolean> {
        try {
            console.log('Starting screenshot capture...');

            this._buffer = await this.captureScreen();
            const sf = this.createSpriteFrame(this._buffer);
            this.cleanSpriteFrame(this.screenSP);
            this.screenSP.spriteFrame = sf;

            console.log('Screenshot completed');
            return true;
        } catch (error) {
            console.error('Screenshot failed:', error);
            return false;
        }
    }

    // Release sprite frame resources
    cleanSpriteFrame(sprite: Sprite) {
        const sf = sprite.spriteFrame;
        if (sf) {
            try {

                const tex = sf?.texture;
                const image = tex?.nativeAsset;
                if (image) image.src = '';
                if (tex) {
                    tex.decRef();
                    tex.destroy();
                }
                sf.decRef();
                sf.destroy();
                sprite.spriteFrame = null;
            } catch (error) {
                console.warn('Error cleaning sprite frame:' + sprite?.name);
            }
        }
    }

    // Save screenshot to native filesystem
    async saveToNative(): Promise<string | null> {
        if (!sys.isNative) {
            console.warn('Non-native platform, cannot save file');
            return null;
        }

        if (!this._buffer) {
            console.error('No screenshot data available');
            return null;
        }

        if (this._filePath) return this._filePath;

        try {
            const timestamp = Date.now();
            const fileName = `screenshot_${timestamp}.jpg`;
            const tempDir = native.fileUtils.getWritablePath();
            const filePath = `${tempDir}${fileName}`;

            const flippedBuffer = this.flipImageVertically(
                this._buffer,
                this._captureSize[0],
                this._captureSize[1]
            );

            await native.saveImageData(
                flippedBuffer,
                this._captureSize[0],
                this._captureSize[1],
                filePath
            );

            this._filePath = filePath;
            console.log('Image saved:', filePath);
            return filePath;

        } catch (error) {
            console.error('Save image failed:', error);
            return null;
        }
    }

    // Clear screenshot data
    clear(): void {
        this._filePath = null;
        this._buffer = null;
        console.log('Screenshot data cleared');
    }

    // Initialize camera and render texture
    private initCamera(): void {
        if (this.rt) return;

        const visibleSize = view.getVisibleSize();
        this._size = [
            Math.round(visibleSize.width * SCALE),
            Math.round(visibleSize.height * SCALE)
        ];

        this.rt = new RenderTexture();
        this.rt.reset({
            width: this._size[0],
            height: this._size[1],
        });

        this.cam.targetTexture = this.rt;
        console.log(`Camera initialized: ${this._size[0]}x${this._size[1]}`);
    }

    // Calculate capture region
    private calculateCaptureRegion(): { x: number; y: number; width: number; height: number } {
        let width = this._captureSize[0];
        let height = this._captureSize[1];

        if (width >= this._size[0]) {
            width = this._size[0] - 10;
            height = Math.round(width * (9 / 16));
            this._captureSize = [width, height];
        }

        const x = Math.max(0, Math.round((this._size[0] - width) * 0.5));
        const y = Math.max(0, Math.round((this._size[1] - height) * 0.5));

        console.log(`Capture region: x=${x}, y=${y}, width=${width}, height=${height}`);

        return { x, y, width, height };
    }

    // Capture screen pixels asynchronously
    private async captureScreen(): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            this.initCamera();
            this.cam.enabled = true;
            this._buffer = null;

            // Wait one frame for camera rendering
            this.scheduleOnce(() => {
                try {
                    const region = this.calculateCaptureRegion();

                    const buffer = this.rt.readPixels(
                        region.x,
                        region.y,
                        region.width,
                        region.height
                    );

                    this.cam.enabled = false;

                    if (!buffer || buffer.length === 0) {
                        reject(new Error('Screenshot buffer is empty'));
                        return;
                    }

                    console.log(`Buffer size: ${buffer.length} bytes`);
                    resolve(buffer);

                } catch (error) {
                    this.cam.enabled = false;
                    reject(null);
                }
            });
        });
    }

    // Create and return sprite frame
    private createSpriteFrame(buffer: Uint8Array): SpriteFrame {
        if (!buffer) {
            console.error('No screenshot data available');
            return;
        }
        try {
            const img = new ImageAsset();
            img.reset({
                _data: buffer,
                width: this._captureSize[0],
                height: this._captureSize[1],
                format: Texture2D.PixelFormat.RGBA8888,
                _compressed: false
            });

            const texture = new Texture2D();
            texture.image = img;

            const sf = new SpriteFrame();
            sf.texture = texture;
            sf.packable = false;
            sf.flipUVY = this.shouldFlipUVY();

            return sf;

        } catch (error) {
            console.warn('Create sprite frame failed:', error);
            return null;
        }
    }

    // Determine if UV flip is needed
    private shouldFlipUVY(): boolean {
        if (sys.isNative) {
            return sys.os !== sys.OS.IOS && sys.os !== sys.OS.OSX;
        }
        return true;
    }

    // Flip image data vertically
    private flipImageVertically(buffer: Uint8Array, width: number, height: number): Uint8Array {
        const bytesPerPixel = 4;
        const rowSize = width * bytesPerPixel;
        const flippedData = new Uint8Array(buffer.byteLength);

        for (let y = 0; y < height; y++) {
            const srcRowStart = y * rowSize;
            const dstRowStart = (height - 1 - y) * rowSize;

            flippedData.set(
                buffer.subarray(srcRowStart, srcRowStart + rowSize),
                dstRowStart
            );
        }

        return flippedData;
    }

    // Clean up resources
    private cleanup(): void {
        if (this.rt) {
            this.rt.destroy();
            this.rt = null;
        }
        this._buffer = null;
        this._filePath = null;
    }
}
