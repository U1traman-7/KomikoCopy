/**
 * 视频处理工具集
 * 
 * 包含视频截取、时长获取、帧提取等功能
 */

// 使用Safari优化的智能剪切函数
export { trimVideoSmart as trimVideo } from './videoTrimmerSafari';
export { extractFrameFromVideo } from './firstFrameExtractor';