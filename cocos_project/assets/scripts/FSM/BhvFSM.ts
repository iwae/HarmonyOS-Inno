import { Component, log, warn, _decorator } from "cc";

const { ccclass, property } = _decorator;



@ccclass
export default class BhvFSM extends Component {


    private stateList: string[] = []; //list of states

    @property
    public debug:boolean = false;

    /**get current state */
    public get currentState(): string {
        return this._currentState;
    }

    public get preState(): string {
        return this._preState;
    }

    @property({
        visible: true
    })
    private _currentState: string = "";
    private _preState: string = "";

    /**current state running time */
    public duration: number = 0;
    /* delta time */
    public dt: number = 0;

    public paused:boolean = false;

    /**
     *  add state to fsm
     * @param state 
     */
    public addState(state: string) {
        let _tmpState = this.getState(state);

        if (_tmpState == null) {
            this.stateList.push(state);
            //if it is the first state, and it is also the default state
            if (this.stateList.length == 1) {
                this._currentState = state;
            }
        }
        else {
            warn(`FSM：this state [${state}] has been added`);
        }
    }

    /**
     * add state groups
     * @param states 
     */
    public addStates(states: object) {
        Object.keys(states).forEach((key) => {
            this.addState(states[key]);
        });

    }

    /**
     * remove state
     * @param state 
     */
    public removeState(state: string) 
    {
        let _tmpState: string = this.getState(state);
        if (_tmpState != null) {
            this.stateList.splice(this.stateList.indexOf(_tmpState), 1);
        }
        else {
            warn(`FSM：this state [${state}] does not exist, no need to be removed`);
        }
    }

    public getState(state: string): string//get state
    {
        if (this.stateList.indexOf(state) !== -1) {
            return state;
        } else {
            return null;
        }
    }

    /**
     * reset state
     */
    public resetState(){
        this.changeState();
    }

    /**
     * change state
     * @param state 
     */
    public changeState(state: string = this._preState) {
        let _tmpState: string = this.getState(state);       

        if (_tmpState == null) {
            log(`FSM：this state [${state}] is not in state group`);
            return;
        }

        if (this._currentState != null) 
        {
            if (this[`on${this._currentState}Exit`]) {
                this[`on${this._currentState}Exit`](this._currentState,this._preState);
            }
        }

        this._preState = this._currentState; 
        this._currentState = _tmpState; 
        this.duration = 0; //state duration =0
        if (this[`on${this._currentState}Enter`]) {
            this[`on${this._currentState}Enter`](this._currentState,this._preState);
        }

        // if(this.debug)cc.log(`${this._preState}>${this._currentState}`);
    }

    public update(dt) {
        // update fsm time
        if(this.paused || dt ==0 )return

        if (this._currentState != null) {
            this.dt =dt;
            this.duration += dt;
            if (this[`on${this._currentState}Update`]) {
                this[`on${this._currentState}Update`](this._currentState,this._preState);
            }
        }
    }

    /**
     *  remove all states
     */
    public RemoveAllState() {
        if (this._currentState != null) {
            if (this[`on${this._currentState}Exit`]) {
                this[`on${this._currentState}Exit`](this._currentState,this._preState);
            }
            this._currentState = null;
        }
        this.stateList.length = 0;
    }
}
