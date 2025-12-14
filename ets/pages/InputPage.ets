import router from '@ohos.router'
import promptAction from '@ohos.promptAction'
import { CocosBridge } from '../bridge/CocosBridge'

@Entry
@Component
struct InputPage {
  @State inputText: string = ''

  build() {
    Column({ space: 20 }) {
      // 标题
      Text('输入对话框')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .fontColor('#333333')
        .margin({ top: 40 })

      // 输入框
      TextInput({
        placeholder: '请输入内容...',
        text: this.inputText
      })
        .width('90%')
        .height(50)
        .fontSize(16)
        .borderRadius(8)
        .backgroundColor('#F5F5F5')
        .placeholderColor('#999999')
        .onChange((value: string) => {
          this.inputText = value
        })
        .margin({ top: 30 })

      // 按钮区域
      Row({ space: 20 }) {
        // 关闭按钮
        Button('关闭')
          .width(100)
          .height(40)
          .fontSize(16)
          .backgroundColor('#E0E0E0')
          .fontColor('#666666')
          .borderRadius(8)
          .onClick(() => {
            // 返回上一页
            router.back()
          })

        // 确认按钮
        Button('设置名字')
          .width(100)
          .height(40)
          .fontSize(16)
          .backgroundColor('#007AFF')
          .fontColor('#FFFFFF')
          .borderRadius(8)
          .onClick(() => {
            // 打印输入的内容到控制台
            console.log('用户输入的内容:', this.inputText)

            // 验证输入内容
            if (this.inputText.trim().length === 0) {
              // 显示提示信息
              promptAction.showToast({
                message: '请输入内容',
                duration: 2000
              })
            } else {
              // 显示输入的内容
              promptAction.showToast({
                message: `输入内容: ${this.inputText}`,
                duration: 2000
              })
              const inputText = this.inputText;
              router.back()

              CocosBridge.call("showText",inputText)


            }
          })
      }
      .margin({ top: 40 })
      .justifyContent(FlexAlign.Center)

      Blank()
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#FFFFFF')
    .alignItems(HorizontalAlign.Center)
    .padding(20)
  }
}