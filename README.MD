
# HarmonyOS 创新能力集合 SDK 使用文档（OHBridge）

本文档面向使用 ArkTS/ArkUI 的 HarmonyOS 应用/游戏开发者，介绍 **OHBridge**（创新能力集合 SDK）的集成方式与能力使用，包括：

- 分享能力：**碰一碰分享** / **隔空分享**（图片 / 超链接）
- 相册保存：保存截图到系统相册
- 传感器：方向传感器监听
- 震动：短震反馈
- TTS：端侧语音朗读/停止
- 应用内跳转：页面路由打开
- 评论弹窗：应用市场评价引导
- AgentKit：展示/隐藏智能体面板（如接入 AgentKitManager）

---

## 1. 运行环境与依赖

### 1.1 HarmonyOS 版本要求

- **隔空分享 gesturesShare**：要求 HarmonyOS **6.0+**（代码中通过 `deviceInfo.majorVersion >= 6` 判断）
- 其余能力根据系统能力判断（`canIUse(...)`），例如传感器、应用市场服务等

### 1.2 Kit 依赖（已在代码中 import）

- `@kit.ShareKit`：`harmonyShare`, `systemShare`
- `@kit.MediaLibraryKit`：`photoAccessHelper`
- `@kit.CoreFileKit`：`fileIo`, `fileUri`
- `@kit.ImageKit`：`image`
- `@kit.SensorServiceKit`：`sensor`, `vibrator`
- `@kit.AppGalleryKit`：`commentManager`
- `@kit.ArkUI`：`promptAction`, `router`
- `@kit.BasicServicesKit`：`deviceInfo`
- `@kit.ArkData`：`uniformTypeDescriptor (utd)`

---

## 2. 快速接入

### 2.1 放置 SDK 文件

将bridge文件夹 放到工程合适目录，例如：

- entry/src/main/ets/bridge

### 2.2 初始化（必须）

SDK 依赖 `OHBridge.uiContext` 和 `OHBridge.context` 才能正常弹 Toast、访问相册等。

在 UIAbility 或页面初始化时赋值：

```ts
    OHBridge.context = getContext(this);
    OHBridge.uiContext = this.getUIContext();
```


---


## 3. API 总览

| 能力 | 方法 | 说明 |
|---|---|---|
| 保存到相册 | `startSave(filePath)` | 将图片保存到系统相册（会弹授权/创建对话框） |
| 删除临时文件 | `deleteTemp()` | 删除 `OHBridge.imagePath` 指向的临时文件 |
| 碰一碰分享 | `startKnockShare(configOrPath)` / `endKnockShare()` | 开启/关闭碰一碰分享监听 |
| 隔空分享 | `startGestureShare(configOrPath)` / `endGestureShare()` | 开启/关闭隔空分享监听（6.0+） |
| WantUri | `getWantUri()` | 获取 SDK 内部记录的 wantUri（当前代码未写入逻辑，可扩展） |
| 传感器 | `sensorOn()` / `sensorOff()` | 开启/关闭方向传感器监听 |
| TTS | `startTTS(text)` / `stopTTS()` | 端侧朗读 |
| 评论弹窗 | `showComment()` | 调起应用市场评论弹窗（需能力支持） |
| 页面跳转 | `openPage(pagePath)` | `router.pushUrl` 打开页面 |
| 震动 | `vibrate(time?)` | 震动（默认 70ms） |
| 图片转 Base64 | `compressAndConvertToBase64(uri, maxSize?, quality?)` | 压缩并输出 base64 DataURL |
| Agent 面板 | `showAgent(params)` / `hideAgent()` | 展示/隐藏 AgentKit 面板 |

---

## 4. 分享能力使用说明（核心）

SDK 支持两种分享数据类型：

- 图片分享：`utd.UniformDataType.JPEG`
- 链接分享：`utd.UniformDataType.HYPERLINK`

### 4.1 分享入参格式（重要）

`startKnockShare()` / `startGestureShare()` 都接收一个字符串参数 `configOrPath`：

1) **JSON 字符串**（推荐）  
2) **纯图片路径字符串**（兼容旧版：默认按图片分享处理）

#### 4.1.1 JSON 配置结构（ShareConfig）

```ts
interface ShareConfig {
  type: 'image' | 'link';
  filePath?: string;       // type=image 必填
  content?: string;        // type=link 必填（超链接 URL）
  title?: string;
  description?: string;
  thumbnailPath?: string;  // 可选
}
```

---

## 5. 使用示例

### 5.1 碰一碰分享：分享图片（战绩/截图）

```ts
import { startKnockShare, endKnockShare } from './sdk/OHBridge';

const cfg = {
  type: 'image',
  filePath: '/data/storage/el2/base/haps/entry/files/tmp/result.jpg',
  title: '我的高光时刻',
  description: '碰一碰发给你看看！',
};

startKnockShare(JSON.stringify(cfg));

// 不需要时关闭监听
// endKnockShare();
```

### 5.2 隔空分享：分享图片（HarmonyOS 6+）

```ts
import { startGestureShare } from './sdk/OHBridge';

const cfg = {
  type: 'image',
  filePath: '/data/storage/el2/base/haps/entry/files/tmp/clip.jpg',
  title: '隔空分享截图',
  description: '看我这波操作',
};

startGestureShare(JSON.stringify(cfg));
```

> 若系统版本 < 6，会 Toast 提示“隔空分享需要 Harmony OS 6.0 以上版本”。

### 5.3 碰一碰组队（示例）：把组队信息放进 Hyperlink

思路：把“队伍信息/口令/房间号”等编码到一个 URL（Hyperlink content）里，通过碰一碰发送给对方；对方点击链接后由你的应用解析并完成入队。

#### 5.3.1 组队链接设计建议

- 推荐使用你自己的 **App Link / Universal Link / 业务域名**（例如 `https://game.example.com/join?...`）
- 或者使用你们内部约定的 scheme（例如 `mygame://join?...`）  
  > 具体可用性取决于系统与应用的 deeplink 配置

组队信息建议包含：

- `teamId`：队伍 ID
- `roomId`：房间号（可选）
- `token`：短期有效入队令牌（建议服务端签发，避免被伪造）
- `ts`：时间戳/过期时间（可选）
- `v`：版本号（便于兼容升级）

#### 5.3.2 生成 hyperlink 并碰一碰分享（ArkTS 示例）

```ts
import { startKnockShare } from './sdk/OHBridge';

function buildJoinLink(teamId: string, token: string) {
  const base = 'https://game.example.com/join';
  const qs = `teamId=${encodeURIComponent(teamId)}&token=${encodeURIComponent(token)}&v=1`;
  return `${base}?${qs}`;
}

const joinUrl = buildJoinLink('T123456', 'SIGNED_TOKEN_FROM_SERVER');

const cfg = {
  type: 'link',
  content: joinUrl,
  title: '碰一碰，一起组队',
  description: '点击链接即可快速加入我的队伍',
  // thumbnailPath: '/data/.../thumb.jpg' // 可选：不填也可以
};

startKnockShare(JSON.stringify(cfg));
```

#### 5.3.3 对端如何“接住”这个链接（

- 在应用启动/拉起时解析 `want` / `uri`，识别 `/join` 路径与参数
  ```ts
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    nativeAppLifecycle.onCreate();
    nativeContext.resourceManagerInit(this.context.resourceManager);
    OHBridge.wantUri = want.uri??null;
  }
  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    OHBridge.wantUri = want.uri??null;
    // to do things.
  }
  ```
- 校验 `token`（服务端验签/换票），通过后自动加入队伍
- 失败时给出清晰提示（链接过期、队伍已满、版本不兼容等）


---

## 6. 保存到相册

### 6.1 保存图片

```ts
import { startSave } from './sdk/OHBridge';

startSave('/data/storage/el2/base/haps/entry/files/tmp/screenshot.jpg');
```

行为说明：

- 会校验文件存在、size>0
- 通过 `photoAccessHelper.showAssetsCreationDialog()` 弹出创建/授权
- 复制文件到相册目标 URI
- 成功 Toast：“已保存到相册”

### 6.2 删除临时文件

```ts
import { deleteTemp } from './sdk/OHBridge';

deleteTemp();
```

> 删除的是 `OHBridge.imagePath` 指向的临时文件；通常在分享/保存后清理。

---

## 7. 传感器：方向监听

```ts
import { sensorOn, sensorOff } from './sdk/OHBridge';

sensorOn();
// ...使用 OHBridge.orientation（alpha,gamma 字符串）...
sensorOff();
```

说明：

- 使用 `sensor.SensorId.ORIENTATION`
- 监听间隔：`50_000_000`（纳秒级参数；以系统定义为准）
- 数据写入 `OHBridge.orientation = alpha + "," + gamma`

---

## 8. 震动

```ts
import { vibrate } from './sdk/OHBridge';

vibrate();       // 默认 70ms
vibrate('120');  // 120ms
```

---

## 9. TTS 端侧朗读

```ts
import { startTTS, stopTTS } from './sdk/OHBridge';

startTTS('欢迎加入队伍，我们准备开打了');
stopTTS();
```

---

## 10. 评论弹窗（应用市场）

```ts
import { showComment } from './sdk/OHBridge';

showComment();
```

触发条件（代码内）：

- `deviceInfo.majorVersion >= 6`
- `canIUse("SystemCapability.AppGalleryService.Distribution")`

---

## 11. 页面跳转

```ts
import { openPage } from './sdk/OHBridge';

openPage('pages/TeamPage'); // 以你工程路由为准
```

---

## 12. 图片压缩并转 Base64（常用于上传头像/分享卡片）

```ts
import { compressAndConvertToBase64 } from './sdk/OHBridge';

const base64 = await compressAndConvertToBase64(
  '/data/storage/el2/base/haps/entry/files/tmp/avatar.jpg',
  500,  // 最大边
  70    // 质量
);
// base64 => data:image/jpeg;base64,...
```

---

## 13. AgentKit 面板

需要先在游戏渲染page的build添加AgentKitComponent, 这里把布局改成了FLEX 也可以根据需求调整.

```ts


  build() {
    Stack() {
      // 主游戏内容层
      Flex({
        direction: FlexDirection.Column,
        alignItems: ItemAlign.Center,
        justifyContent: FlexAlign.Center
      } as FlexOptions) {
        XComponent({ id: 'xcomponentId', type: 'surface', libraryname: 'cocos' })
          .focusable(true)
          .defaultFocus(true)
          .gesture(
            PanGesture(this.panOption)
              .onActionStart((event: GestureEvent) => {
                this.onMouseWheel("actionStart", event);
              })
              .onActionUpdate((event: GestureEvent) => {
                this.onMouseWheel("actionUpdate", event);
              })
              .onActionEnd((event: GestureEvent) => {
                this.onMouseWheel("actionEnd", event);
              })
          )
          .onLoad((context) => {
            // Set the cache directory in the ts layer.
            this.workPort.postMessage("onXCLoad");
          })
          .onDestroy(() => {
            console.log('cocos onDestroy')
          })

        ForEach(this.webViewArray, (item: WebViewInfo) => {
          CocosWebView({ viewInfo: item, workPort: this.workPort })
        }, (item: WebViewInfo): string => item.viewTag.toString())

        ForEach(this.videoArray, (item: VideoInfo) => {
          CocosVideoPlayer({ videoInfo: item, workPort: this.workPort })
        }, (item: VideoInfo): string => item.viewTag.toString())
      }
      .width('100%')
      .height('100%')
      AgentKitComponent({
        config: {
          agentId: 'Enter Your Agent ID',
          bottom: 8,
          isShowShadow: true,
          backgroundColor: 0x209F9FFF,
          titleColors: [0x5A63F5, 0x000000, 0x2B36D9]
        }
      })
    }
    .width('100%')
    .height('100%')
    .alignContent(Alignment.Bottom)
  }
}


```


### 13.1 展示

`showAgent(params: string)` 需要一个 JSON 字符串：

```ts
import { showAgent } from './sdk/OHBridge';

showAgent(JSON.stringify({
  tittle: '队伍助手',
  query: '帮我生成一个3人开黑的分工建议',
  options: {
    // 这里按你的 AgentKitShowOptions 定义传
  }
}));
```

### 13.2 隐藏

```ts
import { hideAgent } from './sdk/OHBridge';

hideAgent();
```

---

## 14. 常见问题（FAQ）

### 14.1 开启了碰一碰/隔空分享，但没有弹出分享/没有反应？

排查建议：

1. 是否已初始化 `OHBridge.uiContext`（Toast/PromptAction 依赖它）
2. 分享数据是否正确：
   - 图片：`filePath` 存在且可访问
   - 链接：`content` 非空，且是有效 URL/scheme
3. 是否重复注册监听：SDK 内部已先 `off` 再 `on`，通常无需额外处理
4. 隔空分享是否 6.0+：`deviceInfo.majorVersion >= 6`

### 14.2 图片分享的缩略图怎么设置？

在 JSON 中传 `thumbnailPath`，SDK 会转为 `thumbnailUri`：

```json
{
  "type": "image",
  "filePath": "/path/a.jpg",
  "thumbnailPath": "/path/thumb.jpg"
}
```

### 14.3 组队链接如何防止被伪造？

建议不要直接把“可入队的关键权限”明文放进 URL。推荐：

- URL 里param只放 `teamId + token`
- token 由服务端签发，短期有效、一次性或限次数
- 服务端校验通过才允许入队

---

## 15. 建议的能力组合玩法（可用于产品/运营分享）

- **碰一碰组队**：Hyperlink 携带队伍口令，一碰即入队
- **隔空分享战绩**：把截图/战绩图作为 JPEG 分享到周围设备
- **碰一碰发攻略**：Hyperlink 指向活动页/攻略页/视频页
- **碰一碰发“我的名片”**：Hyperlink 指向个人主页（带 UID 参数）
- **震动 + TTS**：组队成功震动提示，并 TTS 播报“队伍已满员，准备开始”

---

## 16. 版本记录（建议你维护）

- v1.0.0：分享（图片/链接）、相册保存、传感器、震动、TTS、评论弹窗、页面跳转、Agent 面板

---

