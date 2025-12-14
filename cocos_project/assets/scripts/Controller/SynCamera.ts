import { _decorator, Camera, Component, screen } from 'cc';
const { ccclass, property} = _decorator;

@ccclass('SynCamera')
export class SynCamera extends Component {
    @property(Camera)
    subCams:Camera[] = [];
    start() {
        screen.on('window-resize',()=>{
            const mainCam = this.node.getComponent(Camera);
            this.subCams.forEach((cam)=>{
                cam.orthoHeight = mainCam.orthoHeight;
            })
        })

    }

  
}

