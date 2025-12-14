import { _decorator, Node, Vec3, RigidBody, Collider, Scene, SceneGlobals, find, v2 } from "cc";
import { SpriteAnimation } from "../Widget/SpriteAnimation";
import BhvFSM from "./BhvFSM";

const { ccclass, property,disallowMultiple } = _decorator;
const _v1 /* as temp Vec3 */ = new Vec3();
const _v2 /* as temp Vec3 */ = new Vec3();
const _camDis = 250;

export const STATE = {
    Random: "Random",
    Forward: "Forward",
    Idle: "Idle",
    WalkLeft: "WalkLeft",
    WalkRight: "WalkRight",
    Atk: "Atk",
    Stop: "Stop",
    Jump: "Jump",
}

@ccclass("Hero FSM")
@disallowMultiple(true)

export default class HeroFSM extends BhvFSM {

    @property(SpriteAnimation)
    anm:SpriteAnimation =null;

    @property
    speed:number = 2;

    static ins:HeroFSM = null;

    private cam:Node =null

    start(){
        this.cam = find("Canvas/RtCamera");
    }

    onEnable(){
        this.RemoveAllState()
        this.addStates(STATE);
        HeroFSM.ins=this;
        this.changeState(STATE.Idle);


    }

    onDisable(){
        this.RemoveAllState()
        HeroFSM.ins=null;

    }

    onIdleEnter() {
        this.anm.Anmimation=0;
    }


    onIdleUpdate() {
     

    }


    onWalkLeftEnter() {
        if(this.anm.Anmimation!=1)this.anm.Anmimation=1;
        this.node.setScale(-1,1)
    }


    onWalkLeftUpdate() {
        _v1.set(this.node.position);
        _v1.x -=this.speed;
        if(_v1.x<-1700) return
        this.node.setPosition(_v1);
        _v2.set(this.cam.position);
        const dis =_v2.x-_v1.x;
        if(dis>_camDis) _v2.x = _v1.x+_camDis;
        this.cam.setPosition(_v2);
    }

    onWalkRightEnter() {
        if(this.anm.Anmimation!=1)this.anm.Anmimation=1;
        this.node.setScale(1,1)
    }


    onWalkRightUpdate() {
        _v1.set(this.node.position);
        _v1.x +=this.speed;
        if(_v1.x>1700) return
        this.node.setPosition(_v1);
        _v2.set(this.cam.position);
        const dis =_v1.x-_v2.x;
        if(dis>_camDis) _v2.x = _v1.x-_camDis;
        this.cam.setPosition(_v2);
    }


   

}