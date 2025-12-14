# Cocos Creator 3.8.7 × HarmonyOS Next 原生能力 SDK 使用说明（MD）

本文结合 **Cocos 构建** 的常见流程，说明如何在 **Cocos Creator 3.8.7** 项目中使用你给出的 `HarmonySDK`（TS 侧反射调用 ArkTS），并强调：**构建后可以直接用“目录级 ets”替换鸿蒙工程里的 ets 目录**完成接入。

---

## 0. 前置条件

- Cocos Creator：**3.8.7**
- Harmony 工程打开工具：**DevEco Studio 6.0**
- 构建平台：**HarmonyOS Next**
- 引擎运行时：**JSVM（必须）**
- 真机 + 可联网 + 登录华为开发者账号（签名/安装/调试需要）

---

## 1. Cocos 侧构建（Creator 3.8.7）

1. 打开 **Build / 构建发布**
2. Platform 选择：**HarmonyOS Next**
3. 引擎/脚本运行时选择：**JSVM**
4. 配置完成后点击 **Build**（或 Make/Run 视你的流程）

构建完成后会生成 Harmony 工程结构，通常在类似路径：

- 其中原生工程通常在：`native/engine/harmonyos-next/`

> 你截图里的面板就是这个流程。

---

## 2. 用 DevEco Studio 6.0 打开工程

用 **DevEco Studio 6.0** 打开构建产物目录中的工程：

- 进入：`native/engine/harmonyos-next/`
- 用 DevEco 打开该目录（它就是一个可编译的 Harmony 工程）

---

## 3. 修改 `entry/build-profile.json5`：增加 `arkOptions`

按你的 CodeLab 步骤，在 `entry/build-profile.json5` 的 `buildOption` 里添加 `arkOptions`，示例：

```json5
// entry/build-profile.json5 (示例片段)
{
  "buildOption": {
    "arkOptions": {
      "runtimeOnly": {
        "sources": [
          "./src/main/ets/bridge/OHBridge.ets"
        ]
      }
    }
  }
}
```

说明：

- `runtimeOnly.sources` 用于声明构建期需要纳入的 ArkTS 源文件（不同模板/版本策略略有差异，你以 CodeLab 为准）。

---

## 4. ArkTS 代码接入方式（重点：支持“目录级替换 ets”）

ets内包含已封装好 ArkTS 代码时，推荐两种接入方式：

### 方式 A：直接替换整个 `ets` 目录（最快）

将目录提供的 `ets` 文件夹整体替换到工程：

- 目标目录一般是：
  - `entry/src/main/ets/`

你可以直接：

1. 备份原目录（可选）
2. 用教程提供的 `ets` 整体覆盖替换

> 这种方式最适合“复用模板”，减少你逐个文件手动接入的工作量。

### 方式 B：手动阅读并迁移（可控）

如果你希望自己逐步接入，重点关注：

- `entry/src/main/ets/bridge/`（被 Cocos 反射调用的桥接类通常在这里）

---

## 5. 注册页面：修改 `resources/.../main_pages.json`

替换/新增了页面（如 CameraPicker、InputPage）后，需要把页面注册到 `main_pages.json`。

路径一般类似：

- `entry/src/main/resources/base/profile/main_pages.json`

按你给的配置，把页面加入 `src`：

```json
{
  "src": [
    "pages/index",
    "pages/CameraPicker",
    "pages/InputPage"
  ]
}
```

> 你也可以直接用教程的 `resources` 资源包整体替换（和 ets 一样的“目录级替换思路”）。

---

## 6. 签名与真机运行（DevEco 6.0）

HarmonyOS Next 真机调试/打包通常要求：

- 联网
- 真机连接
- 登录华为开发者账号
- 配置签名

菜单路径（你给的）：

- **File / Signing Configs**

配置完成后，Run/Build 即可在真机安装调试。

---

## 7. Cocos 侧 SDK（TS）使用说明

你给出的 `HarmonySDK` 属于 **Cocos（TS）→ ArkTS（桥接类）** 的反射调用封装。

### 7.1 放置位置建议

建议放在 Cocos 工程：

- `assets/scripts/sdk/HarmonySDK.ts`（或任意你习惯的目录）

然后业务脚本中引用：

```ts
import { HarmonySDK } from './sdk/HarmonySDK';

HarmonySDK.showToast('Hello Harmony');
```

### 7.2 桥接模块路径（重要）

SDK 内部写死了：

```ts
private readonly MODULE_PATH = 'entry/src/main/ets/bridge/OHBridge';
```

这意味着你的 ArkTS 侧需要存在对应模块/类，并且 **native.reflection** 能按这个路径定位到它的 **静态方法**。

> 如果你教程里的桥接文件路径不是 `entry/src/main/ets/bridge/OHBridge.ets`（或等价导出路径），要么改 ArkTS 目录结构匹配它，要么修改 `MODULE_PATH` 与 ArkTS 保持一致。

---

## 8. 功能接口一览（TS 侧）

> 下列调用都只在 `sys.platform === sys.Platform.OPENHARMONY` 时生效；其它平台会 warn，不会崩溃。

### 8.1 相册保存

```ts
HarmonySDK.saveToGallery(filePath);
HarmonySDK.deleteTempFile();
```

### 8.2 TTS

```ts
HarmonySDK.startTTS('你好，鸿蒙');
HarmonySDK.stopTTS();
```

### 8.3 分享（支持两种参数：字符串路径 / 配置对象）

**图片路径模式：**

```ts
HarmonySDK.startGestureShare('/data/storage/xxx/test.png');
HarmonySDK.startKnockShare('/data/storage/xxx/test.png');
```

**配置对象模式：**

```ts
HarmonySDK.startGestureShare({
  type: 'link',
  content: 'https://example.com',
  title: '标题',
  description: '描述'
});
```

关闭：

```ts
HarmonySDK.endGestureShare();
HarmonySDK.endKnockShare();
```

### 8.4 UI 交互

```ts
HarmonySDK.showToast('保存成功');
HarmonySDK.vibrate(70);

HarmonySDK.showAgent('标题', 'query内容');
HarmonySDK.hideAgent();
```

### 8.5 打开页面（ArkUI 页面）

```ts
HarmonySDK.openCamera();     // openPage('bridge/CameraPicker')（注意：你 ArkTS 页面路径需匹配）
HarmonySDK.openInputPage();  // openPage('bridge/InputPage')
```


### 8.6 图片压缩转 Base64（异步）

```ts
const base64 = await HarmonySDK.compressImageToBase64(imageUri, 500, 70);
```

---

## 9. 回调：ArkTS → Cocos（window 全局函数）

SDK 通过：

```ts
window[callbackName] = callback;
```

来注册回调，ArkTS 侧可通过 JSVM 环境调用同名全局函数实现回传。

示例：

```ts
HarmonySDK.on('onShowText', (text) => {
  console.log('来自原生:', text);
});

HarmonySDK.on('onShowImage', async (base64) => {
  // 你可以把 base64 转 Texture/SpriteFrame
});
```

移除：

```ts
HarmonySDK.off('onShowText');
```

---

## 10. 常见坑位检查清单（建议你在文档里写上）

1. **JSVM 必须启用**（否则反射/桥接能力可能不符合预期）
2. **MODULE_PATH 与 ArkTS 桥接类路径一致**
3. **openPage 路径与 `main_pages.json` 注册路径一致**
4. DevEco 工程改动后建议 **Sync/Build** 一次，避免缓存导致找不到 ets
5. 真机运行：必须 **签名 + 联网 + 登录账号**

---
