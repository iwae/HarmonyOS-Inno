import { _decorator, Component, screen, RenderTexture, Sprite, Camera, view, UITransform, director, Size } from 'cc';
import { EDITOR, EDITOR_NOT_IN_PREVIEW } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;
declare var Editor: any;
@ccclass('rtAdapter')
@executeInEditMode(true)
export class rtAdapter extends Component {
    @property(RenderTexture)
    rt: RenderTexture = null!;
    @property(Camera)
    protected cam: Camera = null!;
    @property(Sprite)
    protected rtSP: Sprite = null!;
    size = new Size()
    static ins: rtAdapter = null!;

    @property({ slide: true, step: 0.05, min: 0.1, max: 1.0 })
    get setRTscale() {
        return this.rtScale;
    }
    set setRTscale(v) {
        if (this._isSetting) return
        this.rtScale = v;
        this.resetRT();
    }
    @property({ visible: false })
    private rtScale: number = 0.8;

    private _isSetting = false;

    start() {
        rtAdapter.ins = this;
        this.resetRT();
        !EDITOR_NOT_IN_PREVIEW && screen.on('window-resize', this.resetRT.bind(this))
    }

    resetRT() {
        this._isSetting = true;
        /* in Editor, somehow we have to clear the target first */
        EDITOR_NOT_IN_PREVIEW && (this.cam.targetTexture = null);
        try {
            /* in Editor we use designed resolution, in run time, we use real content size */
            const size = EDITOR_NOT_IN_PREVIEW ? view.getDesignResolutionSize() : this.node.getComponent(UITransform).contentSize;
            const width = Math.round(size.width * this.rtScale);
            const height = Math.round(size.height * this.rtScale);
            this.size.set(width, height);
            this.rt.resize(width, height);
            this.cam.targetTexture = this.rt;
            this._isSetting = false;
            if (this.rtSP && EDITOR) {
                this.rtSP.onLoad()
                this.rtSP.onEnable()
                this.rtSP.customMaterial.onLoaded();
            }

        } catch (e) {
            console.log("no cam")
        }




    }


}

