import { promptAction, router } from '@kit.ArkUI';
import { image } from '@kit.ImageKit';
import { JSON, util } from '@kit.ArkTS';
import { fileIo as fs, fileUri } from '@kit.CoreFileKit';
import { harmonyShare, systemShare } from '@kit.ShareKit';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { uniformTypeDescriptor as utd } from '@kit.ArkData';
import { deviceInfo } from '@kit.BasicServicesKit';
import { sensor, vibrator } from '@kit.SensorServiceKit';
import { common } from '@kit.AbilityKit';
import { commentManager } from '@kit.AppGalleryKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import tts from './TTSCtrl';
import { AgentKitManager, AgentKitShowOptions } from './agent/AgentKitManager';

/**
 * HarmonyOS Bridge 核心类
 * HarmonyOS Bridge Core Class
 */
export class OHBridge {
  static uiContext: UIContext | null = null;
  static context: Context | null = null;
  static imagePath: string | null = null; // 临时文件路径 | Temporary file path
  static orientation: string | null = null; // 设备方向数据 | Device orientation data
  static shareData: systemShare.SharedData | null = null; // 分享数据对象 | Share data object
  static wantUri: string | null = null; // Link 分享路径 | Link share path

  /**
   * 将截图保存到系统相册
   * Save screenshot to system gallery
   * @param FilePath - 文件路径 | File path
   * @returns 是否保存成功 | Whether save succeeded
   */
  static async saveToGallery(FilePath: string): Promise<boolean> {
    try {
      if (!OHBridge.context) {
        throw new Error('AbilityCtrl.context 未初始化 | AbilityCtrl.context not initialized');
      }
      console.log('收到文件路径 | Received file path:', FilePath);

      // 验证文件是否存在 | Validate file existence
      if (!fs.accessSync(FilePath)) {
        throw new Error(`文件不存在 | File does not exist: ${FilePath}`);
      }
      const fileSize = fs.statSync(FilePath).size;
      console.log(`源文件大小 | Source file size: ${fileSize} bytes`);

      if (fileSize === 0) {
        throw new Error('文件大小为 0 | File size is 0');
      }

      // 获取相册访问助手 | Get photo access helper
      const phAccessHelper = photoAccessHelper.getPhotoAccessHelper(OHBridge.context);

      // 准备创建选项 | Prepare creation options
      const timestamp = Date.now();
      const displayName = `image_${timestamp}`;
      const srcFileUri = fileUri.getUriFromPath(FilePath);

      const srcFileUris: Array<string> = [srcFileUri];
      const photoCreationConfigs: Array<photoAccessHelper.PhotoCreationConfig> = [
        {
          title: displayName,
          fileNameExtension: 'jpg',
          photoType: photoAccessHelper.PhotoType.IMAGE,
          subtype: photoAccessHelper.PhotoSubtype.DEFAULT
        }
      ];

      // 弹窗授权并获取目标 URI | Show dialog for authorization and get target URI
      const desFileUris: Array<string> = await phAccessHelper.showAssetsCreationDialog(
        srcFileUris,
        photoCreationConfigs
      );

      // 复制文件到相册 | Copy file to gallery
      const desFile = fs.openSync(desFileUris[0], fs.OpenMode.WRITE_ONLY);
      const srcFile = fs.openSync(FilePath, fs.OpenMode.READ_ONLY);
      await fs.copyFile(srcFile.fd, desFile.fd);
      fs.closeSync(srcFile);
      fs.closeSync(desFile);
      console.log('文件复制成功 | File copy succeeded');
      showToast("已保存到相册");
      return true;
    } catch (error) {
      console.error('保存错误 | Save error:', JSON.stringify(error));
      return false;
    }
  }

  /**
   * 碰一碰/隔空分享回调函数
   * Knock/Gesture share callback
   */
  static immersiveCallback = async (sharableTarget: harmonyShare.SharableTarget) => {
    try {
      await sharableTarget.share(OHBridge.shareData);
      console.info('分享成功 | Share succeeded');
    } catch (error) {
      console.error('分享失败 | Share failed:', JSON.stringify(error));
    }
  }
}

/**
 * 分享数据结果接口
 * Share data result interface
 */
interface ShareDataResult {
  shareData: systemShare.SharedData; // 分享数据对象 | Share data object
  imagePath: string | null; // 图片文件路径 | Image file path
}

/**
 * 分享数据配置接口
 * Share data configuration interface
 */
interface ShareConfig {
  type: 'image' | 'link';  // 分享类型：图片或链接 | Share type: image or link
  filePath?: string;        // 图片路径（图片分享时必填）| Image path (required for image share)
  content?: string;         // 链接地址（链接分享时必填）| Link URL (required for link share)
  title?: string;           // 分享标题 | Share title
  description?: string;     // 分享描述 | Share description
  thumbnailPath?: string;   // 缩略图路径（可选）| Thumbnail path (optional)
}

interface AgentConfig{
  tittle:string,
  query:string,
  options?:AgentKitShowOptions,
}

/**
 * 创建分享数据对象（包含兼容性处理和文件路径提取）
 * Create share data object (with compatibility handling and file path extraction)
 * @param configOrPath - JSON配置字符串 或 图片文件路径（兼容旧版）| JSON config string or image path (backward compatible)
 * @returns ShareDataResult
 */
function createShareData(configOrPath: string): ShareDataResult {
  let config: ShareConfig;
  let imagePath: string | null = null;

  // 尝试解析为JSON配置 | Try to parse as JSON config
  try {
    config = JSON.parse(configOrPath) as ShareConfig;
    console.log('使用JSON配置 | Using JSON config:', config);
    imagePath = config.filePath || null;
  } catch (e) {
    // 解析失败，按图片路径处理 | Parse failed, treat as image path
    console.log('使用图片路径模式 | Using image path mode:', configOrPath);
    config = {
      type: 'image',
      filePath: configOrPath,
    };
    imagePath = configOrPath;
  }

  let shareData: systemShare.SharedData;

  // 根据类型创建分享数据 | Create share data based on type
  if (config.type === 'image') {
    // 图片分享 | Image share
    if (!config.filePath || !fs.accessSync(config.filePath)) {
      throw new Error('图片文件不存在 | Image file does not exist');
    }
    const imageUri = fileUri.getUriFromPath(config.filePath);

    shareData = new systemShare.SharedData({
      utd: utd.UniformDataType.JPEG,
      uri: imageUri,
      title: config.title || '游戏精彩分享',
      description: config.description || '来看看我发现的好玩游戏!',
      thumbnailUri: config.thumbnailPath ? fileUri.getUriFromPath(config.thumbnailPath) : imageUri,
    });
  } else {
    // 链接分享 | Link share
    if (!config.content) {
      throw new Error('链接地址不能为空 | Link URL cannot be empty');
    }

    const thumbnailUri = config.thumbnailPath && fs.accessSync(config.thumbnailPath)
      ? fileUri.getUriFromPath(config.thumbnailPath)
      : undefined;

    shareData = new systemShare.SharedData({
      utd: utd.UniformDataType.HYPERLINK,
      content: config.content,
      title: config.title || '分享链接',
      description: config.description || '点击查看更多内容',
      thumbnailUri: thumbnailUri,
    });
  }

  return { shareData, imagePath };
}

/**
 * 保存图片到相册
 * Save image to gallery
 * @param FilePath - 生成的文件路径 | File path
 */
export function startSave(FilePath: string) {
  try {
    console.log("文件路径 | File path:", FilePath);

    // 验证文件存在 | Validate file existence
    if (!fs.accessSync(FilePath)) {
      console.error('文件不存在 | File does not exist:', FilePath);
      showToast("文件不存在");
      return;
    }
    OHBridge.imagePath = FilePath;
    showToast("正在保存到相册");

    // 直接保存到相册 | Save directly to gallery
    OHBridge.saveToGallery(FilePath);
  } catch (error) {
    console.error('保存失败 | Save failed:', JSON.stringify(error));
    showToast("保存失败");
  }
}

/**
 * 获取 Want URI
 * Get Want URI
 * @returns Want URI 字符串 | Want URI string
 */
export function getWantUri() {
  return OHBridge.wantUri;
}

/**
 * 删除临时文件
 * Delete temporary file
 */
export function deleteTemp() {
  const imagePath = OHBridge.imagePath;
  if (imagePath) {
    try {
      if (fs.accessSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('临时文件已删除 | Temporary file deleted:', imagePath);
      }
    } catch (error) {
      console.error('删除临时文件失败 | Failed to delete temporary file:', JSON.stringify(error));
    }
  }
}

/**
 * 显示应用评论弹窗
 * Show app comment dialog
 */
export function showComment(): void {
  try {
    const version = deviceInfo.majorVersion;
    if (version >= 6 && canIUse("SystemCapability.AppGalleryService.Distribution")) {
      const uiContext = OHBridge.uiContext!.getHostContext() as common.UIAbilityContext;
      commentManager.showCommentDialog(uiContext).then(() => {
        console.log("显示评论弹窗 | Show comment dialog");
      }).catch((error: BusinessError<Object>) => {
        hilog.error(0, 'TAG', `评论弹窗失败 | Comment dialog failed, Code: ${error.code}, message: ${error.message}`);
      });
    }
  } catch (error) {
    hilog.error(0, 'TAG', `评论弹窗失败 | Comment dialog failed, Code: ${error.code}, message: ${error.message}`);
  }
}

/**
 * 开启隔空分享
 * Enable gesture share
 * @param configOrPath - JSON配置字符串 或 图片文件路径 | JSON config string or image path
 */
export function startGestureShare(configOrPath: string) {
  const version = deviceInfo.majorVersion;
  if (version < 6) {
    showToast("隔空分享需要Harmony OS 6.0 以上版本");
    return;
  }

  try {
    const result = createShareData(configOrPath);
    OHBridge.shareData = result.shareData;
    OHBridge.imagePath = result.imagePath;
    harmonyShare.off('gesturesShare', OHBridge.immersiveCallback);
    harmonyShare.on('gesturesShare', OHBridge.immersiveCallback);
    showToast("隔空分享已开启");
  } catch (error) {
    console.error('开启隔空监听失败 | Failed to enable gesture share:', JSON.stringify(error));
    showToast("开启分享失败");
  }
}

/**
 * 关闭隔空分享
 * Disable gesture share
 */
export function endGestureShare(): void {
  const version = deviceInfo.majorVersion;
  if (version < 6) {
    return;
  }
  try {
    harmonyShare.off('gesturesShare', OHBridge.immersiveCallback);
    console.info('隔空分享已关闭 | Gesture share disabled');
  } catch (error) {
    if (version >= 6) {
      showToast("请打开隔空分享");
    }
    console.error('关闭隔空监听失败 | Failed to disable gesture share:', JSON.stringify(error));
  }
}

/**
 * 开启碰一碰分享
 * Enable knock share
 * @param configOrPath - JSON配置字符串 或 图片文件路径（兼容旧版）| JSON config string or image path (backward compatible)
 */
export function startKnockShare(configOrPath: string) {
  try {
    const result = createShareData(configOrPath);
    OHBridge.shareData = result.shareData;
    OHBridge.imagePath = result.imagePath;
    harmonyShare.off('knockShare', OHBridge.immersiveCallback);
    harmonyShare.on('knockShare', OHBridge.immersiveCallback);
    showToast("碰一碰分享已开启");
  } catch (error) {
    console.error('开启碰一碰监听失败 | Failed to enable knock share:', JSON.stringify(error));
    showToast("开启分享失败");
  }
}

/**
 * 关闭碰一碰分享
 * Disable knock share
 */
export function endKnockShare(): void {
  try {
    harmonyShare.off('knockShare', OHBridge.immersiveCallback);
    console.info('碰一碰监听已关闭 | Knock share disabled');
  } catch (error) {
    console.error('关闭碰一碰监听失败 | Failed to disable knock share:', JSON.stringify(error));
  }
}

/**
 * 开启方向传感器监听
 * Enable orientation sensor
 */
export function sensorOn(): void {
  try {
    if (canIUse("SystemCapability.Sensors.Sensor")) {
      sensor.on(sensor.SensorId.ORIENTATION, (orientationData: sensor.OrientationResponse) => {
        const alpha = orientationData.alpha; // 方位角 | Azimuth angle
        OHBridge.orientation = alpha + "," + orientationData.gamma;
      }, { interval: 50000000 })
    }
  } catch (error) {
    console.error('传感器开启失败 | Sensor enable failed:', error);
  }
}

/**
 * 关闭方向传感器监听
 * Disable orientation sensor
 */
export function sensorOff(): void {
  try {
    if (canIUse("SystemCapability.Sensors.Sensor")) {
      sensor.off(sensor.SensorId.ORIENTATION);
    }
  } catch (error) {
    console.error('传感器关闭失败 | Sensor disable failed:', error);
  }
}

/**
 * 端侧 TTS 朗读
 * Start TTS (Text-to-Speech)
 * @param param - 朗读文本 | Text to speak
 */
export function startTTS(param: string): void {
  tts.speak(param);
}

/**
 * 停止 TTS 朗读
 * Stop TTS (Text-to-Speech)
 */
export function stopTTS(): void {
  tts.stop();
}

export function showAgent(params:string){
  try{
    const config = JSON.parse(params) as AgentConfig;
    const tittle = config.tittle || "标题";
    const query = config.query || "内容";
    const option = config.options;

    AgentKitManager.getInstance().show(tittle,query,option);
  }catch (error) {
    console.error('解析失败', error);
  }
}

export function hideAgent(){
  try{
    AgentKitManager.getInstance().hide();
  }catch (error) {
    console.error('隐藏失败', error);
  }
}
/**
 * 显示 Toast 提示
 * Show Toast message
 * @param param - 提示文本 | Message text
 */
export function showToast(param: string): void {
  try {
    OHBridge.uiContext!.getPromptAction().showToast({
      message: param,
      duration: 2000,
      showMode: promptAction.ToastShowMode.DEFAULT,
      bottom: 80
    });
  } catch (error) {
    console.error('Toast 显示失败 | Toast show failed:', error);
  }
}

/**
 * 打开指定页面
 * Open specified page
 * @param pagePath - 页面路径 | Page path
 */
export function openPage(pagePath: string): void {
  router.pushUrl({
    url: pagePath
  }).catch(() => {
    console.error('页面跳转失败 | Page navigation failed');
  });
}

export async function vibrate(time:string = "70") {
  try {
    const t = parseInt(time) ?? 70;
    await vibrator.startVibration({
      type: 'time',
      duration: t // 震动时长，单位毫秒
    }, {
      usage: 'notification'
    });
  } catch (error) {
    // TODO: Implement error handling.
  }
}

/**
 * 组合方法：图片文件转 Base64
 * Combined method: Convert image file to Base64
 * @param imageUri - 图片文件路径 | Image file path
 * @param maxSize - 最大尺寸限制，默认 500 | Max size limit, default 500
 * @param quality - 图片质量，默认 70 | Image quality, default 70
 * @returns Promise<string>
 */
export async function compressAndConvertToBase64(
  imageUri: string,
  maxSize: number = 500,
  quality: number = 70
): Promise<string> {
  // 先转换为 PixelMap | Convert to PixelMap first
  const pixelMap = await pathToPixelMap(imageUri, maxSize);
  // 再转换为 Base64 | Then convert to Base64
  const base64 = await pixelMapToBase64(pixelMap, quality);

  // 释放 PixelMap 资源 | Release PixelMap resources
  pixelMap.release();

  return base64;
}

/**
 * 将图片文件转换为 PixelMap
 * Convert image file to PixelMap
 * @param imageUri - 图片文件路径 | Image file path
 * @param maxSize - 最大尺寸限制，默认 500 | Max size limit, default 500
 * @param rotate - 旋转角度，默认 0 | Rotation angle, default 0
 * @returns Promise<image.PixelMap>
 */
export async function pathToPixelMap(imageUri: string, maxSize: number = 500, rotate = 0): Promise<image.PixelMap> {
  return new Promise<image.PixelMap>((resolve, reject) => {
    try {
      console.log(`开始处理图片 | Start processing image: ${imageUri}`);
      let filePath = imageUri;

      fs.open(filePath, fs.OpenMode.READ_ONLY, (err, file) => {
        if (err) {
          console.error("文件打开失败 | File open failed:", err.message, "code:", err.code);
          reject("文件打开失败 | File open failed");
          return;
        }

        // 使用 async IIFE (立即执行的异步函数) | Use async IIFE (Immediately Invoked Function Expression)
        (async () => {
          try {
            const fd = file.fd;
            const stat = await fs.stat(fd);

            const buffer = new ArrayBuffer(stat.size);
            // 读取文件内容 | Read file content
            await fs.read(fd, buffer, {
              offset: 0,
              length: stat.size
            });
            console.log(`读取文件成功 | File read succeeded, size: ${stat.size} bytes`);

            // 使用 image 模块处理图片 | Process image using image module
            const imageSource = image.createImageSource(buffer);
            console.log('成功从缓冲区创建图片源 | Image source created from buffer');

            const info = await imageSource.getImageInfo();
            const size = info.size;

            const maxDimension = Math.max(size.width, size.height);
            const scale = maxSize / maxDimension;
            const w = Math.floor(size.width * scale);
            const h = Math.floor(size.height * scale);

            // 创建图片实例 | Create image instance
            const pixelMap = await imageSource.createPixelMap({
              sampleSize: 1,
              editable: true,
              rotate: rotate,
              desiredSize: {
                width: w,
                height: h
              }
            });
            console.log(`成功创建 PixelMap | PixelMap created, w=${w}, h=${h}`);

            // 释放图片源资源 | Release image source
            imageSource.release();
            // 关闭文件 | Close file
            await fs.close(fd);

            resolve(pixelMap);
          } catch (innerError) {
            console.error("处理过程中出错 | Error during processing:", innerError);
            // 如果打开了文件，尝试关闭 | Try to close file if opened
            if (file && file.fd) {
              try {
                await fs.close(file.fd);
              } catch (closeError) {
                console.error("关闭文件失败 | Failed to close file:", closeError);
              }
            }
            reject("图片处理失败 | Image processing failed: " + innerError);
          }
        })();
      });

    } catch (error) {
      console.error("pathToPixelMap 外层错误 | pathToPixelMap outer error:", error);
      reject("图片转换失败 | Image conversion failed: " + error);
    }
  });
}

/**
 * 将 PixelMap 转换为 Base64 字符串
 * Convert PixelMap to Base64 string
 * @param pixelMap - PixelMap 对象 | PixelMap object
 * @param quality - 图片质量，默认 70 | Image quality, default 70
 * @param type - 图片类型，默认 'image/jpeg' | Image type, default 'image/jpeg'
 * @returns Promise<string>
 */
export async function pixelMapToBase64(
  pixelMap: image.PixelMap,
  quality: number = 70,
  type: string = 'image/jpeg'
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      console.log('开始将 PixelMap 转换为 Base64 | Start converting PixelMap to Base64');

      (async () => {
        try {
          // 转换成 base64 | Convert to base64
          const imagePackerApi = image.createImagePacker();
          const data = await imagePackerApi.packToData(pixelMap, {
            format: type,
            quality: quality
          });
          console.log(`图片压缩成功 | Image compression succeeded, size: ${data.byteLength} bytes`);

          let bufferArr = new Uint8Array(data);
          let help = new util.Base64Helper();
          let base = help.encodeToStringSync(bufferArr);

          // 释放资源 | Release resources
          imagePackerApi.release();

          const base64 = `data:${type};base64,` + base;
          console.log(`Base64 编码完成 | Base64 encoding completed, length: ${base64.length}`);

          resolve(base64);

        } catch (innerError) {
          console.error("Base64 转换过程中出错 | Error during Base64 conversion:", innerError);
          reject("Base64 转换失败 | Base64 conversion failed: " + innerError);
        }
      })();

    } catch (error) {
      console.error("pixelMapToBase64 外层错误 | pixelMapToBase64 outer error:", error);
      reject("Base64 转换失败 | Base64 conversion failed: " + error);
    }
  });
}