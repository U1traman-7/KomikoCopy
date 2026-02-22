/**
 * Tool Card Styles - 统一的工具页面卡片样式
 *
 * 遵循 Komiko 主题系统规范（docs/css-theme-guide.md）：
 * - 使用语义化颜色类（text-foreground、bg-card、border-border）
 * - 禁止硬编码 hex 颜色
 * - 禁止使用 text-white、text-black、bg-gray-* 等硬编码颜色
 * - 品牌色 primary-* 自动反转，无需 dark: 覆盖
 */

export const TOOL_CARD_STYLES = {
  /**
   * 输入区域卡片样式
   * - bg-card: 卡片背景（自动适配深色模式）
   * - border-primary-200: 品牌色边框（自动反转）
   * - shadow-md md:shadow-2xl: 响应式阴影
   */
  inputCard: 'bg-card shadow-md md:shadow-2xl border-1.5 border-primary-200',

  /**
   * 输出区域卡片样式
   * - border-primary-50: 更浅的品牌色边框（自动反转）
   */
  outputCard: 'bg-card shadow-md md:shadow-2xl border-1.5 border-primary-50',

  /**
   * Modal 组件 classNames 配置
   * - backdrop: 半透明黑色背景 + 模糊效果
   * - base: Modal 容器边框（品牌色）
   */
  modalClassNames: {
    backdrop: 'bg-black/50 backdrop-blur-sm',
    base: 'border border-primary-200 bg-card',
  },
} as const;
