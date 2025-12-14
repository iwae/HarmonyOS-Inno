import { camera, cameraPicker as picker } from '@kit.CameraKit'
import { fileIo, fileUri } from '@kit.CoreFileKit'
import { router } from '@kit.ArkUI';
import { compressAndConvertToBase64 } from '../bridge/OHBridge';
import { CocosBridge } from '../bridge/CocosBridge';

@Entry
@Component
struct CameraPicker {
  @State imgSrc: string = '';
  @State videoSrc: string = '';

  build() {
    RelativeContainer() {
      Column() {
        Image(this.imgSrc).width(250).height(130).backgroundColor(Color.Black).margin(5);
        Video({ src: this.videoSrc}).width(250).height(130).autoPlay(true);
        Button("测试拍照 Photo&Video").fontSize(20)
          .fontWeight(FontWeight.Bold)
          .onClick(async () => {
            let pathDir = getContext().filesDir;
            let fileName = `${new Date().getTime()}`
            let filePath = pathDir + `/${fileName}.tmp`
            fileIo.createRandomAccessFileSync(filePath, fileIo.OpenMode.CREATE);

            let uri = fileUri.getUriFromPath(filePath);
            let pickerProfile: picker.PickerProfile = {
              cameraPosition: camera.CameraPosition.CAMERA_POSITION_BACK,
              saveUri: uri
            };
            let result: picker.PickerResult =
              await picker.pick(getContext(), [picker.PickerMediaType.PHOTO, picker.PickerMediaType.VIDEO],
                pickerProfile);
            console.info(`picker resultCode: ${result.resultCode},resultUri: ${result.resultUri},mediaType: ${result.mediaType}`);
            if (result.resultCode == 0) {
              if (result.mediaType === picker.PickerMediaType.PHOTO) {
                this.imgSrc = result.resultUri;
              } else {
                this.videoSrc = result.resultUri;
                this.imgSrc = '';
              }
            }
          }).margin(5);
        Button("设置头像").fontSize(20)
          .fontWeight(FontWeight.Bold)
          .onClick(async () => {
            if(this.imgSrc !== ''){
              const base64 = await compressAndConvertToBase64(this.imgSrc);
              CocosBridge.call('showImg', base64);
            }
            router.back()
          });

      }.alignRules({
        center: { anchor: '__container__', align: VerticalAlign.Center },
        middle: { anchor: '__container__', align: HorizontalAlign.Center }
      });
    }
    .height('100%')
    .width('100%')
  }
}