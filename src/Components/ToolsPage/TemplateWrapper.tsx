import React from 'react'
import { useTranslation } from 'react-i18next'

interface TemplateData {
  seo: {
    title: string
    metaDescription: string
    metaKeywords: string
    ogDescription: string
  }
  placeholderText?: string
  defaultStyle?: string
  content: {
    header: {
      title: string
      subtitle: string
    }
    sections: {
      whatIs?: {
        title: string
        description: string
      }
      howToUse?: {
        title: string
        subtitle: string
        steps: Array<{
          title: string
          content: string
        }>
      }
      whyUse?: {
        title: string
        subtitle: string
        features: Array<{
          title: string
          content: string
        }>
      }
      styles?: Array<{
        title: string
        content: string
      }>
      applications?: Array<{
        title: string
        content: string
      }>
    }
    examples: Array<{
      title: string
      image: string
      alt: string
    }>
    faq?: Array<{
      question: string
      answer: string
    }>
    cta?: {
      title: string
      description: string
      buttonText: string
    }
    tips?: {
      title: string
      items: string[]
    }
  }
}

interface TemplateWrapperProps {
  children: React.ReactElement
  variantData?: TemplateData
  isVariant?: boolean
  toolName?: string
  variantName?: string
}

// 创建一个 context 来传递变体数据
export const VariantContext = React.createContext<{
  variantData?: TemplateData
  isVariant: boolean
  toolName?: string
  variantName?: string
}>({
  isVariant: false,
})

export function TemplateWrapper({
  children,
  variantData,
  isVariant = false,
  toolName,
  variantName,
}: TemplateWrapperProps) {
  return (
    <VariantContext.Provider
      value={{ variantData, isVariant, toolName, variantName }}>
      {children}
    </VariantContext.Provider>
  )
}

// Hook 用于在子组件中获取变体数据（支持i18n）
export function useVariantData() {
  const context = React.useContext(VariantContext)
  const toolName = context?.toolName || 'ai-anime-generator'
  const { t, i18n } = useTranslation([toolName])

  // 如果没有context（不在TemplateWrapper内），返回默认值
  if (!context) {
    return {
      isVariant: false,
      data: null,
      variantName: undefined,
      getContent: (path: string, fallbackKey?: string) =>
        t(fallbackKey || path),
    }
  }

  // 如果是变体页面，尝试加载翻译数据
  if (context.isVariant && context.toolName && context.variantName) {
    // 尝试加载对应语言的variant翻译
    const currentLang = i18n.language || 'en'

    // 动态导入variant翻译文件的函数
    const loadVariantTranslation = async () => {
      try {
        const variantTranslation = await import(
          `../../i18n/locales/${currentLang}/variants/${context.toolName}-${context.variantName}.json`
        )
        return variantTranslation.default
      } catch (error) {
        console.log(
          `No variant translation found for ${currentLang}/${context.toolName}-${context.variantName}, using original data`,
        )
        return null
      }
    }

    // 使用React状态来存储加载的翻译数据
    const [variantTranslation, setVariantTranslation] =
      React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
      // 确保所有必需的值都存在
      if (currentLang && context.toolName && context.variantName) {
        loadVariantTranslation().then(translation => {
          setVariantTranslation(translation)
          setIsLoading(false)
        })
      }
    }, [currentLang, context.toolName || '', context.variantName || '']) // 使用空字符串作为fallback

    return {
      isVariant: true,
      data: context.variantData,
      variantName: context.variantName,
      isLoading,
      // 提供一个 fallback 函数，优先使用i18n翻译，然后是变体数据，最后是默认翻译
      getContent: (path: string, fallbackKey?: string) => {
        // 如果有翻译数据，优先使用
        if (variantTranslation) {
          const keys = path.split('.')
          let current: any = variantTranslation

          for (const key of keys) {
            if (current && current[key] !== undefined) {
              current = current[key]
            } else {
              break
            }
          }

          if (current !== variantTranslation) {
            return current
          }
        }

        // 如果没有翻译数据，使用原始变体数据
        if (context.variantData?.content) {
          const keys = path.split('.')
          let current: any = context.variantData.content

          for (const key of keys) {
            if (current && current[key] !== undefined) {
              current = current[key]
            } else {
              // 如果变体数据中没有，使用默认翻译
              return fallbackKey ? t(fallbackKey) : t(path)
            }
          }

          return current
        }

        // 最后使用默认翻译
        return fallbackKey ? t(fallbackKey) : t(path)
      },
    }
  }

  return {
    isVariant: false,
    data: null,
    variantName: undefined,
    isLoading: false,
    getContent: (path: string, fallbackKey?: string) => t(fallbackKey || path),
  }
}
