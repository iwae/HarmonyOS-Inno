import { textToSpeech } from '@kit.CoreSpeechKit';
import { BusinessError } from '@kit.BasicServicesKit';

export class TTSCtrl {
  private _id = 0;
  private ttsEngine: textToSpeech.TextToSpeechEngine | null = null;
  private initPromise: Promise<void> | null = null;
  private isSupported: boolean = false;

  extraParam: Record<string, Object> = {
    "speed": 1.05,
    "volume": 0.8,
    "pitch": 1.08,
    "languageContext": 'zh-CN',
    "audioType": "pcm",
    "playType": 1
  };

  // 公开的 listener 对象,可以直接修改
  listener: textToSpeech.SpeakListener = {
    onStart: (requestId: string, response: textToSpeech.StartResponse) => {
      console.info('onStart: requestId: ' + requestId);
    },
    onComplete: (requestId: string, response: textToSpeech.CompleteResponse) => {
      console.info('onComplete: requestId: ' + requestId);
    },
    onStop: (requestId: string, response: textToSpeech.StopResponse) => {
      console.info('onStop: requestId: ' + requestId);
    },
    onData: (requestId: string, audio: ArrayBuffer, response: textToSpeech.SynthesisResponse) => {
      console.log('onData: requestId: ' + requestId);
    },
    onError: (requestId: string, errorCode: number, errorMessage: string) => {
      console.error('onError: requestId: ' + requestId +
        ' errorCode: ' + errorCode + ' errorMessage: ' + errorMessage);
    }
  };

  constructor() {
    this.isSupported = canIUse("SystemCapability.AI.TextToSpeech");
    if (!this.isSupported) {
      console.warn('TTS capability not supported on this device, TTS features will be disabled');
    }
  }

  isTTSSupported(): boolean {
    return this.isSupported;
  }

  async init(): Promise<void> {
    if (!this.isSupported) {
      console.info('TTS not supported, skipping initialization');
      return Promise.resolve();
    }

    if (this.ttsEngine) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInit();

    try {
      await this.initPromise;
    } catch (err) {
      const error = err as BusinessError;
      console.error('TTS init failed but continuing: ' + error.code + ' ' + error.message);
      this.initPromise = null;
    } finally {
    }
  }

  private async _doInit(): Promise<void> {
    let extraParam: Record<string, Object> = {
      "style": 'interaction-broadcast',
      "locate": 'CN',
      "name": 'EngineName'
    };

    let initParamsInfo: textToSpeech.CreateEngineParams = {
      language: 'zh-CN',
      person: 0,
      online: 1,
      extraParams: extraParam
    };

    try {
      const res = await textToSpeech.createEngine(initParamsInfo);
      this.ttsEngine = res;
      console.info('TTS engine created successfully');

      // 使用公共的 listener 对象
      this.ttsEngine.setListener(this.listener);
    } catch (err) {
      const error = err as BusinessError;
      console.error('TTS engine creation failed: code=' + error.code + ' message=' + error.message);
      this.ttsEngine = null;
      this.initPromise = null;
      throw err;
    }
  }

  // 新增:更新 listener (引擎已初始化时立即生效)
  updateListener(): void {
    if (this.ttsEngine && this.isSupported) {
      this.ttsEngine.setListener(this.listener);
      console.info('TTS listener updated');
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.isSupported) {
      console.info('TTS not supported, skipping speak: ' + text);
      return Promise.resolve();
    }

    await this.init();

    if (!this.ttsEngine) {
      console.warn('TTS engine not available, skipping speak: ' + text);
      return Promise.resolve();
    }

    this._id++;
    let speakParams: textToSpeech.SpeakParams = {
      requestId: this._id + "",
      extraParams: this.extraParam
    };

    try {
      this.ttsEngine.speak(text, speakParams);
    } catch (err) {
      const error = err as BusinessError;
      console.error('Speak failed: ' + error.code + ' ' + error.message);
    }
  }

  stop(): void {
    if (!this.isSupported || !this.ttsEngine) {
      return;
    }

    try {
      this.ttsEngine.stop();
    } catch (err) {
      const error = err as BusinessError;
      console.error('Stop failed: ' + error.code + ' ' + error.message);
    }
  }

  shutdown(): void {
    if (!this.isSupported || !this.ttsEngine) {
      return;
    }

    try {
      this.ttsEngine.shutdown();
      this.ttsEngine = null;
      this.initPromise = null;
      console.info('TTS engine shutdown successfully');
    } catch (err) {
      const error = err as BusinessError;
      console.error('Shutdown failed: ' + error.code + ' ' + error.message);
    }
  }
}

let tts = new TTSCtrl();

export default tts;