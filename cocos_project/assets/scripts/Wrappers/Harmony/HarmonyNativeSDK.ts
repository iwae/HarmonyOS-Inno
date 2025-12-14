import { native, sys } from 'cc';

/**
 * 分享配置接口 | Share Configuration Interface
 */
interface ShareConfig {
    type: 'image' | 'link';          // 分享类型 | Share type
    filePath?: string;               // 图片路径 | Image path
    content?: string;                // 链接地址 | Link URL
    title?: string;                  // 分享标题 | Share title
    description?: string;            // 分享描述 | Share description
    thumbnailPath?: string;          // 缩略图路径 | Thumbnail path
}

/**
 * 鸿蒙原生能力 SDK | HarmonyOS Native SDK
 * 提供相册保存、分享、UI 交互等原生功能 | Provides gallery save, share, UI interaction and other native features
 * 
 * @example
 * ```typescript
 * HarmonySDK.saveToGallery(filePath);
 * HarmonySDK.startGestureShare(filePath);
 * HarmonySDK.showToast('保存成功');
 * ```
 */
class HarmonyNativeSDK {
    private readonly MODULE_PATH = 'entry/src/main/ets/bridge/OHBridge';

    /**
     * 检查是否为鸿蒙平台 | Check if running on HarmonyOS
     */
    private isHarmonyPlatform(): boolean {
        return sys.platform === sys.Platform.OPENHARMONY;
    }

    /**
     * 调用鸿蒙原生静态方法 | Call HarmonyOS native static method
     * @param methodName - 方法名 | Method name
     * @param params - 参数 | Parameters
     * @param isSync - 是否同步调用 | Whether to call synchronously
     */
    private callNativeMethod(methodName: string, params: string = '', isSync: boolean = true): any {
        if (!this.isHarmonyPlatform()) {
            console.warn(`[HarmonySDK] 当前平台不支持 | Platform not supported: ${methodName}`);
            return null;
        }

        try {
            return native.reflection.callStaticMethod(
                this.MODULE_PATH,
                methodName,
                params,
                isSync
            );
        } catch (error) {
            console.error(`[HarmonySDK] 调用失败 | Call failed: ${methodName}`, error);
            return null;
        }
    }

    /**
     * 准备分享配置 | Prepare share configuration
     * @param configOrPath - 配置对象或图片路径 | Config object or image path
     */
    private prepareShareConfig(configOrPath: ShareConfig | string): string | null {
        if (!configOrPath) {
            console.error('[HarmonySDK] 分享参数不能为空 | Share parameter cannot be empty');
            return null;
        }

        // 字符串路径模式 | String path mode
        if (typeof configOrPath === 'string') {
            console.log('[HarmonySDK] 图片路径模式 | Image path mode:', configOrPath);
            return JSON.stringify({ type: 'image', filePath: configOrPath });
        }

        // 配置对象模式 | Config object mode
        console.log('[HarmonySDK] 配置对象模式 | Config object mode:', configOrPath);

        // 验证配置 | Validate config
        if (configOrPath.type === 'image' && !configOrPath.filePath) {
            console.error('[HarmonySDK] 图片分享需要 filePath | Image share requires filePath');
            return null;
        }
        if (configOrPath.type === 'link' && !configOrPath.content) {
            console.error('[HarmonySDK] 链接分享需要 content | Link share requires content');
            return null;
        }

        return JSON.stringify(configOrPath);
    }

    // ==================== 相册保存 | Gallery Save ====================

    /**
     * 保存图片到系统相册 | Save image to system gallery
     * @param filePath - 图片文件路径 | Image file path
     */
    saveToGallery(filePath: string): void {
        if (!filePath) {
            console.error('[HarmonySDK] 文件路径不能为空 | File path cannot be empty');
            return;
        }
        this.callNativeMethod('startSave', filePath);
    }

    /**
     * 删除临时文件 | Delete temporary file
     */
    deleteTempFile(): void {
        this.callNativeMethod('deleteTemp');
    }

    // ==================== TTS 语音 | TTS Speech ====================

    /**
     * 开始 TTS 朗读 | Start TTS speech
     * @param msg - 朗读文本 | Text to speak
     */
    startTTS(msg: string): void {
        this.callNativeMethod('startTTS', msg);
    }

    /**
     * 停止 TTS 朗读 | Stop TTS speech
     */
    stopTTS(): void {
        this.callNativeMethod('stopTTS');
    }

    // ==================== 隔空分享 | Gesture Share ====================

    /**
     * 开启隔空分享 | Enable gesture share
     * @param configOrPath - 配置对象或图片路径 | Config object or image path
     */
    startGestureShare(configOrPath: ShareConfig | string): void {
        const configJson = this.prepareShareConfig(configOrPath);
        if (configJson) {
            this.callNativeMethod('startGestureShare', configJson);
        }
    }

    /**
     * 关闭隔空分享 | Disable gesture share
     */
    endGestureShare(): void {
        this.callNativeMethod('endGestureShare');
    }

    // ==================== 碰一碰分享 | Knock Share ====================

    /**
     * 开启碰一碰分享 | Enable knock share
     * @param configOrPath - 配置对象或图片路径 | Config object or image path
     */
    startKnockShare(configOrPath: ShareConfig | string): void {
        const configJson = this.prepareShareConfig(configOrPath);
        if (configJson) {
            this.callNativeMethod('startKnockShare', configJson);
        }
    }

    /**
     * 关闭碰一碰分享 | Disable knock share
     */
    endKnockShare(): void {
        this.callNativeMethod('endKnockShare');
    }

    // ==================== UI 交互 | UI Interaction ====================

    /**
     * 显示 Toast 提示 | Show toast message
     * @param message - 提示信息 | Message text
     */
    showToast(message: string): void {
        if (!message) {
            console.warn('[HarmonySDK] 提示信息不能为空 | Message cannot be empty');
            return;
        }
        this.callNativeMethod('showToast', message);
    }

    vibrate(time = 70): void {
        this.callNativeMethod('vibrate', time.toString());
    }

    showAgent(tittle: string, query: string): void {
        const params = JSON.stringify({ tittle:tittle, query:query });
        this.callNativeMethod('showAgent', params);
    }

    hideAgent(): void {
        this.callNativeMethod('hideAgent');
    }

    /**
     * 打开指定页面 | Open specified page
     * @param pagePath - 页面路径 | Page path
     */
    openPage(pagePath: string): void {
        this.callNativeMethod('openPage', pagePath);
    }

    /**
     * 打开相机页面 | Open camera page
     */
    openCamera(): void {
        this.openPage('bridge/CameraPicker');
    }

    /**
     * 打开 ArkUI 输入页面 | Open ArkUI input page
     */
    openInputPage(): void {
        this.openPage('bridge/InputPage');
    }

    // ==================== 图片处理 | Image Processing ====================

    /**
     * 图片文件转 Base64（带压缩）| Convert image to Base64 (with compression)
     * @param imageUri - 图片路径 | Image path
     * @param maxSize - 最大尺寸 | Max size (default: 500)
     * @param quality - 图片质量 | Image quality (0-100, default: 70)
     */
    async compressImageToBase64(
        imageUri: string,
        maxSize: number = 500,
        quality: number = 70
    ): Promise<string | null> {
        if (!this.isHarmonyPlatform()) {
            console.warn('[HarmonySDK] 当前平台不支持 | Platform not supported');
            return null;
        }

        if (!imageUri) {
            console.error('[HarmonySDK] 图片路径不能为空 | Image path cannot be empty');
            return null;
        }

        try {
            const params = JSON.stringify({ imageUri, maxSize, quality });
            return await native.reflection.callStaticMethod(
                this.MODULE_PATH,
                'compressAndConvertToBase64',
                params,
                false // 异步调用 | Async call
            );
        } catch (error) {
            console.error('[HarmonySDK] 图片压缩失败 | Image compression failed:', error);
            return null;
        }
    }

    // ==================== 工具方法 | Utility Methods ====================

    /**
     * 获取平台名称 | Get platform name
     */
    getPlatformName(): string {
        return this.isHarmonyPlatform() ? 'HarmonyOS' : sys.platform;
    }

    /**
     * 检查 SDK 是否可用 | Check if SDK is available
     */
    isAvailable(): boolean {
        return this.isHarmonyPlatform();
    }

    /**
     * 注册引擎回调 | Register engine callback
     * @param callbackName - 回调名称 | Callback name
     * @param callback - 回调函数 | Callback function
     * 
     * @example
     * ```typescript
     * HarmonySDK.on('onShowText', (text) => {
     *   this.label.string = text;
     * });
     * 
     * HarmonySDK.on('onShowImage', async (base64) => {
     *   const sf = await this.createSpriteFromBase64(base64);
     *   this.sprite.spriteFrame = sf;
     * });
     * ```
     */
    on(callbackName: string, callback: (data: any) => void | Promise<void>): void {
        window[callbackName] = callback;
        console.log(`[HarmonySDK] 已注册回调 | Callback registered: ${callbackName}`);
    }

    /**
     * 移除引擎回调 | Remove engine callback
     * @param callbackName - 回调名称 | Callback name
     */
    off(callbackName: string): void {
        window[callbackName] = null;
        console.log(`[HarmonySDK] 已移除回调 | Callback removed: ${callbackName}`);
    }
}

/**
 * 鸿蒙原生能力 SDK 单例 | HarmonyOS Native SDK Singleton
 * 
 * @example
 * ```typescript
 * import { HarmonySDK } from './HarmonySDK';
 * 
 * HarmonySDK.saveToGallery(filePath);
 * HarmonySDK.showToast('保存成功');
 * HarmonySDK.startGestureShare(filePath);
 * ```
 */
export const HarmonySDK = new HarmonyNativeSDK();

export default HarmonySDK;