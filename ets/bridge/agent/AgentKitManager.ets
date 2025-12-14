import { FunctionComponent, FunctionController } from '@kit.AgentFrameworkKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

/**
 * AgentKit 位置枚举（内部使用）
 */
enum AgentKitPosition {
  TOP = 'top',
  BOTTOM = 'bottom'
}

/**
 * AgentKit 显示选项
 */
export interface AgentKitShowOptions {
  title: string;
  queryText?: string;
  agentId?: string;  // 新增:支持动态修改 agentId
  isShowShadow?: boolean;
  backgroundColor?: number;
  titleColors?: number[];
}

/**
 * AgentKit 配置
 */
export interface AgentKitConfig {
  agentId: string;  // 改为必填
  top?: number;
  bottom?: number;
  defaultVisible?: boolean;
  isShowShadow?: boolean;
  backgroundColor?: number;
  titleColors?: number[];
}

/**
 * AgentKit 管理器 SDK
 */
export class AgentKitManager {
  private static instance: AgentKitManager;
  private visibleStateCallback?: (visible: boolean) => void;
  private optionsStateCallback?: (options: AgentKitShowOptions) => void;
  private agentIdStateCallback?: (agentId: string) => void;  // 新增:agentId 状态回调

  private config: AgentKitConfig = {
    agentId: '',
    top: 10,
    defaultVisible: false,
    isShowShadow: true,
    backgroundColor: 0x209F9FFF,
    titleColors: [0x5A63F5, 0x000000, 0x2B36D9]
  };

  private defaultShowOptions: AgentKitShowOptions = {
    title: '智能助手',
    queryText: '',
    isShowShadow: true,
    backgroundColor: 0x209F9FFF,
    titleColors: [0x5A63F5, 0x000000, 0x2B36D9]
  };

  static getInstance(): AgentKitManager {
    if (!AgentKitManager.instance) {
      AgentKitManager.instance = new AgentKitManager();
    }
    return AgentKitManager.instance;
  }

  configure(config: AgentKitConfig): void {
    if (config.agentId !== undefined) {
      this.config.agentId = config.agentId;
    }
    if (config.top !== undefined) {
      this.config.top = config.top;
      this.config.bottom = undefined;
    }
    if (config.bottom !== undefined) {
      this.config.bottom = config.bottom;
      this.config.top = undefined;
    }
    if (config.defaultVisible !== undefined) {
      this.config.defaultVisible = config.defaultVisible;
    }
    if (config.isShowShadow !== undefined) {
      this.config.isShowShadow = config.isShowShadow;
      this.defaultShowOptions.isShowShadow = config.isShowShadow;
    }
    if (config.backgroundColor !== undefined) {
      this.config.backgroundColor = config.backgroundColor;
      this.defaultShowOptions.backgroundColor = config.backgroundColor;
    }
    if (config.titleColors !== undefined) {
      this.config.titleColors = config.titleColors;
      this.defaultShowOptions.titleColors = config.titleColors;
    }
  }

  registerStateCallbacks(
    visibleCallback: (visible: boolean) => void,
    optionsCallback: (options: AgentKitShowOptions) => void,
    agentIdCallback: (agentId: string) => void  // 新增:注册 agentId 回调
  ): void {
    this.visibleStateCallback = visibleCallback;
    this.optionsStateCallback = optionsCallback;
    this.agentIdStateCallback = agentIdCallback;

    if (this.config.defaultVisible) {
      this.optionsStateCallback?.(this.defaultShowOptions);
      this.visibleStateCallback?.(true);
    }
  }

  /**
   * 显示 AgentKit
   * @param title 标题
   * @param queryText 查询文本(可选)
   * @param customOptions 自定义选项(可选)
   */
  show(title: string, queryText?: string, customOptions?: Partial<AgentKitShowOptions>): void {
    if (!canIUse("SystemCapability.AI.Agent.AgentKit")) {
      hilog.warn(0x0001, 'AgentKitManager', 'AgentKit capability not supported');
      return;
    }

    // 如果传入了 agentId,则使用传入的,否则使用配置的默认值
    const finalAgentId = customOptions?.agentId || this.config.agentId;

    const options: AgentKitShowOptions = {
      title: title,
      queryText: queryText || '',
      agentId: finalAgentId,
      isShowShadow: customOptions?.isShowShadow ?? this.config.isShowShadow ?? true,
      backgroundColor: customOptions?.backgroundColor ?? this.config.backgroundColor,
      titleColors: customOptions?.titleColors ?? this.config.titleColors
    };

    hilog.info(0x0001, 'AgentKitManager', `Showing AgentKit: ${options.title}, AgentID: ${finalAgentId}`);

    // 如果 agentId 发生变化,通知组件更新
    if (finalAgentId !== this.config.agentId) {
      this.agentIdStateCallback?.(finalAgentId);
    }

    this.optionsStateCallback?.(options);
    this.visibleStateCallback?.(true);
  }

  hide(): void {
    hilog.info(0x0001, 'AgentKitManager', 'Hiding AgentKit');
    this.visibleStateCallback?.(false);
  }

  getConfig(): AgentKitConfig {
    return this.config;
  }

  getPosition(): AgentKitPosition {
    if (this.config.bottom !== undefined) {
      return AgentKitPosition.BOTTOM;
    }
    return AgentKitPosition.TOP;
  }

  getMargin(): number {
    if (this.config.bottom !== undefined) {
      return this.config.bottom;
    }
    return this.config.top || 10;
  }

  getDefaultVisible(): boolean {
    return this.config.defaultVisible || false;
  }
}

/**
 * AgentKit 组件（支持直接传入配置）
 */
@Component
export struct AgentKitComponent {
  // 可选的配置参数,如果传入则自动配置
  config?: AgentKitConfig;

  @State private visible: boolean = false;
  @State private currentAgentId: string = '';  // 新增:当前使用的 agentId
  @State private options: AgentKitShowOptions = {
    title: '',
    queryText: ''
  };

  private controller: FunctionController | null = null;
  private manager: AgentKitManager = AgentKitManager.getInstance();

  aboutToAppear(): void {

    if (canIUse("SystemCapability.AI.Agent.AgentKit")) {
      // 如果传入了配置,先配置
      if (this.config) {
        this.manager.configure(this.config);
      }

      // 初始化 currentAgentId
      this.currentAgentId = this.manager.getConfig().agentId;

      this.controller = new FunctionController();

      this.controller?.on('agentDialogOpened', () => {
        hilog.info(0x0001, 'AgentKit', 'Dialog opened');
      });

      this.controller?.on('agentDialogClosed', () => {
        hilog.info(0x0001, 'AgentKit', 'Dialog closed');
      });

      this.manager.registerStateCallbacks(
        (visible: boolean) => {
          this.visible = visible;
        },
        (options: AgentKitShowOptions) => {
          this.options = options;
          // 如果 options 中包含 agentId,则更新当前 agentId
          if (options.agentId) {
            this.currentAgentId = options.agentId;
          }
        },
        (agentId: string) => {
          // agentId 变化时更新
          this.currentAgentId = agentId;
          hilog.info(0x0001, 'AgentKit', `AgentID changed to: ${agentId}`);
        }
      );
    }
  }

  aboutToDisappear(): void {
    if (canIUse("SystemCapability.AI.Agent.AgentKit")) {
      this.controller?.off('agentDialogOpened');
      this.controller?.off('agentDialogClosed');
    }
  }

  build() {
    if (this.visible && canIUse("SystemCapability.AI.Agent.AgentKit")) {
      Column() {
        FunctionComponent({
          agentId: this.currentAgentId,  // 使用当前的 agentId
          onError: (err: BusinessError) => {
            hilog.warn(0x0001, 'AgentKit', `Error: ${err.code}, message: ${err.message}`);
          },
          options: {
            title: this.options.title,
            queryText: this.options.queryText || '',
            backgroundColor: this.options.backgroundColor || 0x209F9FFF,
            titleColors: this.options.titleColors || [0x5A63F5, 0x000000, 0x2B36D9],
            isShowShadow: this.options.isShowShadow ?? true
          },
          controller: this.controller!
        })
          .margin(
            this.manager.getPosition() === AgentKitPosition.TOP
              ? { top: this.manager.getMargin() }
              : { bottom: this.manager.getMargin() }
          )
      }
      .alignItems(HorizontalAlign.Center)
      .transition(TransitionEffect.OPACITY.animation({ duration: 300 }))
    }
  }
}