import { _decorator, Component, Node, Sprite, SpriteFrame, CCInteger, SpriteAtlas } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, menu,disallowMultiple,executionOrder } = _decorator;

@ccclass('anm')
export class anm {
    @property({ type: CCInteger })
    start: number = 0;
    @property({ type: CCInteger })
    end: number = 10;
    @property
    frame: number = 0.05;
    @property
    name: string = "";
    @property({ type: SpriteAtlas })
    atlas: SpriteAtlas = null;
}

@ccclass('SpriteAnimation')
@menu("spriteAnm")
@disallowMultiple(true)
@executionOrder(-1)
@executeInEditMode
export class SpriteAnimation extends Sprite {


    @property({ type: anm })
    anms: anm[] = [];

    @property({ type: CCInteger })
    get defaultAnm() {
        return this._currentAnm;
    }
    set defaultAnm(v) {
        this._currentAnm = v;
        if (this._editorPlaying) {
            this.playNewAnm();
        }
    }

    @property
    playOnLoad: boolean = true;

    @property
    get playInEditor() {
        return this._editorPlaying
    }

    set playInEditor(v) {
        this._editorPlaying = v;
        if (this._editorPlaying) {
            this.playNewAnm();
        } else {
            this.stop()
        }

    }

    private anmName = "";

    private anmFrame = 0.05

    private startFrame = 0;

    private endFrame = 10;

    private frame = 0;

    private _currentAnm = 0;

    private _editorPlaying = false;

    get Anmimation(): number {
        return this._currentAnm;
    }

    set Anmimation(v: number) {
        this._currentAnm = v;
        this.playNewAnm();
    }

    start() {
        this.trim = false;

        if (this.playOnLoad && !EDITOR) {
            this.playNewAnm();
        }
    }

    playAnm() {
        this.frame++;
        if (this.frame > this.endFrame) this.frame = this.startFrame;
        this.spriteFrame = this.spriteAtlas.getSpriteFrame(this.anmName + this.frame)
    }

    playNewAnm() {
        this.unschedule(this.playAnm)
        const i = this.defaultAnm;
        if (!this.anms[i]) {
            this.stop();
            console.error("animation_" + i + " not exist")
            return;
        }
        this.startFrame = this.frame = this.anms[i].start;
        this.endFrame = this.anms[i].end;
        this.anmFrame = this.anms[i].frame;
        this.anmName = this.anms[i].name;
        this.spriteAtlas = this.anms[i].atlas;
        this.play();
    }

    play() {
        this.schedule(this.playAnm, this.anmFrame)
    }

    stop() {
        this.unschedule(this.playAnm)
    }

}

