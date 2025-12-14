import { _decorator, assetManager, Component, EditBox, ImageAsset, Label, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { HarmonySDK } from './Wrappers/Harmony/HarmonyNativeSDK';
const { ccclass, property } = _decorator;

@ccclass('Game')
export class GameCtrl extends Component {
    @property(Node) btn_Toast: Node = null;
    @property(Node) btn_Camera: Node = null;
    @property(Node) btn_ArkUI: Node = null;
    @property(Node) btn_Vibrate: Node = null;
    @property(Node) btn_TTS: Node = null;
    @property(Node) btn_ShowAgent: Node = null;
    @property(Node) btn_HideAgent: Node = null;

    @property(Sprite) SpritePlate: Sprite = null;
    @property(Label) LabelPlate: Label = null;

    start() {
        this.btn_Toast.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.showToast(this.LabelPlate.string || 'test')
        })
        this.btn_Camera.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.openCamera();
        })
        this.btn_ArkUI.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.openInputPage();
        })
        this.btn_Vibrate.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.vibrate(100);
        })
        this.btn_TTS.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.startTTS("正在朗读,姓名是"+this.LabelPlate.string || 'TTS朗读测试')
        })

        this.btn_ShowAgent.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.showAgent(this.LabelPlate.string,"介绍下"+this.LabelPlate.string)
        })
        this.btn_HideAgent.on(Node.EventType.TOUCH_END, () => {
            HarmonySDK.hideAgent();
        })


        HarmonySDK.on("showText", (text: string) => {
            this.LabelPlate.string = text;
        })
        HarmonySDK.on("showImg",async (text: string) => {
            const tex = await this.createTexWithBase64(text)
            const sf = new SpriteFrame();
            sf.texture = tex;
            this.SpritePlate.spriteFrame = sf;
            const maxSize = 100;
            const width = tex.width || 100;
            const height = tex.height || 100;
            // 计算缩放比例，保持宽高比
            const scaleX = maxSize / width;
            const scaleY = maxSize / height;
            const scale = Math.min(scaleX, scaleY); // 取最小的缩放比例，确保不超过任何一个维度的限制

            // 计算最终尺寸
            const finalWidth = width * scale;
            const finalHeight = height * scale;
            this.SpritePlate.node.getComponent(UITransform).setContentSize(finalWidth, finalHeight)
        })

    }


    public createTexWithBase64(base64Src: string, url = "abcd1234"): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const that = this
            img.onload = function (info) {
                const imageAsset = that.createImageAsset(img, url);
                const tex = that.createTexture2DWtihImageAsset(imageAsset, url);
                resolve(tex);
            };
            img.onerror = () => {
                reject(null);
            };
            img.src = base64Src;
        });
    }
    public createImageAsset(img: HTMLImageElement, url = "abcd1234"): ImageAsset {
        const imgAsset = new ImageAsset(img);
        imgAsset._uuid = url;
        assetManager.assets.add(imgAsset._uuid, imgAsset);
        imgAsset._nativeUrl = imgAsset._uuid;
        assetManager.dependUtil._depends.add(imgAsset._uuid, { deps: [], nativeDep: [] });
        return imgAsset;
    }
    public createTexture2DWtihImageAsset(imgAsset: ImageAsset, url = "abcd1234"): Texture2D {
        const texture = new Texture2D();
        texture.image = imgAsset;
        //@ts-ignore
        texture._uuid = url;
        //@ts-ignore
        texture._nativeUrl = '';
        //@ts-ignore
        assetManager.assets.add(texture._uuid, texture);
        assetManager.dependUtil._depends.add(texture._uuid, { deps: [imgAsset._uuid], nativeDep: [] });
        return texture;
    }




}

