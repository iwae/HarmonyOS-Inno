
import { _decorator, Component, Node, Vec3, Vec2, EventTouch, UIOpacity } from 'cc';
import HeroFSM, { STATE } from '../FSM/Hero FSM';


const { ccclass, property } = _decorator;

const _tempVec3 = new Vec3();
const _tempVec2 = new Vec2();

@ccclass('JoyStick')
export class JoyStick extends Component {

    @property
    maxRadius = 10;

    @property({ type: UIOpacity })
    rootView: UIOpacity = null;

    @property({ type: Node })
    touchArea: Node | null = null;

    @property({ type: Node })
    control: Node | null = null;

    @property({ type: Node })
    jumpBtn: Node | null = null;

    @property({ type: Node })
    joyStick: Node = null!;


    direction: Vec3 = new Vec3();

    distance: number = 0;

    magnitude: number = 0;


    private startPos = new Vec3();

    public static JoyStick: JoyStick = null;
 




    onEnable() {
  

        this.touchArea.on(Node.EventType.TOUCH_START, this.touchStart, this);
        this.touchArea.on(Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.touchArea.on(Node.EventType.TOUCH_END, this.touchEnd, this);
        this.touchArea.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        this.startPos.set(this.joyStick.position);
        JoyStick.JoyStick= this.node.getComponent(JoyStick)
        this.rootView.opacity=255;

    }

    onDisable(){
        this.touchArea.off(Node.EventType.TOUCH_START, this.touchStart, this);
        this.touchArea.off(Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.touchArea.off(Node.EventType.TOUCH_END, this.touchEnd, this);
        this.touchArea.off(Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        this.rootView.opacity=0;
     
    }



    touchStart(event: EventTouch) {
        this.joyStick.setWorldPosition(event.getUILocation().x, event.getUILocation().y, 0);
        this.rootView.opacity=150;

    }

    touchMove(event: EventTouch) {

        event.getUILocation(_tempVec2);
        this.joyStick.getWorldPosition(_tempVec3);
        let x = _tempVec2.x - _tempVec3.x
        if(x<0){

            if(x<-this.maxRadius) x =-this.maxRadius
            /* change State */
            HeroFSM.ins.changeState(STATE.WalkLeft)

        }else{
            if(x>this.maxRadius) x =this.maxRadius
            HeroFSM.ins.changeState(STATE.WalkRight)

        }
   
        _tempVec3.set(x);
 

        this.control.setPosition(_tempVec3);
    }


    touchEnd() {
        HeroFSM.ins.changeState(STATE.Idle)
        // this.rotation = 0;
        this.rootView.opacity=255;

        this.magnitude = 0;
        this.direction.set(Vec3.ZERO);
        this.control.setPosition(Vec3.ZERO);
        this.joyStick.setPosition(this.startPos)
    }


    async jumpStart() {

    }

 

}