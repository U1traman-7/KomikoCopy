import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enDict from './locales/en'
import deDict from './locales/de'
import frDict from './locales/fr'
import esDict from './locales/es'
import hiDict from './locales/hi'
import idDict from './locales/id'
import jaDict from './locales/ja'
import koDict from './locales/ko'
import ptDict from './locales/pt'
import zhCNDict from './locales/zh-CN'
import zhTWDict from './locales/zh-TW'
import ruDict from './locales/ru'
import thDict from './locales/th'
import viDict from './locales/vi'

/**
 * 英语（English）-全球通用语言，必须支持
 * 简体中文（ChineseSimplified）-主要面向中国大陆用户
 * 繁体中文（ChineseTraditional）-适用于台湾、香港和部分海外华人
 * 日语（Japanese）-日本市场非常重要，尤其是二次元、动漫相关内容
 * 韩语（Korean）-韩国市场用户活跃，适合二次元和创意内容
 * 西班牙语（Spanish）-覆盖拉美和西班牙，全球使用人数第二
 * 法语（French）-适用于法国、加拿大（魁北克）、非洲部分地区
 * 德语（German）-欧洲市场重要语言之一
 * 葡萄牙语（Portuguese）-巴西市场庞大，适合扩展拉美市场
 */

const resources = {
  en: enDict,
  de: deDict,
  'zh-CN': zhCNDict,
  'zh-TW': zhTWDict,
  'ru': ruDict,
  'fr': frDict,
  'es': esDict,
  'hi': hiDict,
  'id': idDict,
  'ja': jaDict,
  'ko': koDict,
  'pt': ptDict,
  'th': thDict,
  'vi': viDict,
};

i18n
  .use(initReactI18next) // bind react-i18next to the instance
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    // react i18next special options (optional)
    // override if needed - omit if ok with defaults
    /*
    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      useSuspense: true,
    }
    */
  });


export default i18n;
