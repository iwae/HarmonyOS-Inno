import { WorkerPort } from "../common/WorkerPort";

export class CocosBridge {

  static workPort: WorkerPort | null = null;

  static call(functionName:string,param:string){
    CocosBridge.workPort?.postMessage(functionName,param)
  }

}
