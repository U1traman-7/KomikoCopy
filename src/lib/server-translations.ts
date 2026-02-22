import fs from 'fs'
import path from 'path'

export interface TranslationData {
  meta: {
    title: string
    description: string
  }
  form: {
    title: string
    subtitle: string
    generate_button: string
  }
  comic_style: {
    anime: string
    american: string
    manga: string
    manhwa: string
    custom: string
  }
  seo: {
    main_heading: string
    main_description: string
  }
  how_to_use: {
    heading: string
    step1: {
      title: string
      content: string
    }
    step2: {
      title: string
      content: string
    }
    step3: {
      title: string
      content: string
    }
    step4: {
      title: string
      content: string
    }
  }
  why_use: {
    heading: string
    description: string
    features: {
      beginner_friendly: { title: string; content: string }
      custom_art: { title: string; content: string }
      amazing_layouts: { title: string; content: string }
      tell_story: { title: string; content: string }
      ai_efficiency: { title: string; content: string }
      high_quality: { title: string; content: string }
      creative_freedom: { title: string; content: string }
      accessible: { title: string; content: string }
      share_comics: { title: string; content: string }
    }
  }
  faq: {
    title: string
    description: string
    edit_after_creation: { question: string; answer: string }
    what_is_comic_generator: { question: string; answer: string }
    what_is_manga_generator: { question: string; answer: string }
    what_is_manhwa_generator: { question: string; answer: string }
    how_to_make_comics: { question: string; answer: string }
    how_it_works: { question: string; answer: string }
    art_styles: { question: string; answer: string }
    what_comics_can_i_generate: { question: string; answer: string }
    commercial_use: { question: string; answer: string }
    need_drawing_skills: { question: string; answer: string }
    for_memes: { question: string; answer: string }
    is_free: { question: string; answer: string }
    share_online: { question: string; answer: string }
    custom_art_styles: { question: string; answer: string }
  }
  auto_post: string
  idea_input: {
    label: string
    placeholder: string
  }
  login_to_generate: string
  comics_generated: string
}

// 默认英文翻译作为回退
const defaultTranslation: TranslationData = {
  meta: {
    title: "AI Comic Generator - KomikoAI",
    description: "The AI Comic Generator that allows you to generate comics from a simple story idea. Use KomikoAI's AI comic generator to generate comics, manhwa and manga with AI."
  },
  form: {
    title: "AI Comic Generator",
    subtitle: "Turn your idea into captivating comics, manga, or manhwa with AI. Simply enter a story idea, choose your style, and let AI Comic Generator do the rest.",
    generate_button: "Generate Comic"
  },
  comic_style: {
    anime: "Anime",
    american: "American",
    manga: "Manga",
    manhwa: "Manhwa",
    custom: "Custom"
  },
  seo: {
    main_heading: "What is AI Comic Generator",
    main_description: "AI Comic Generator is an AI-powered tool that allows creators to turn ideas into captivating comics, manga, and memes with minimal effort. Whether you're an artist or a storytelling enthusiast, bring your imagination to life with AI-generated visuals and narration."
  },
  how_to_use: {
    heading: "How to use AI Comic Generator",
    step1: {
      title: "Step 1: Enter Your Idea",
      content: "Enter a concept, story idea, or meme inspiration. Write a simple sentence or describe your story in detail."
    },
    step2: {
      title: "Step 2: Customize Your Style",
      content: "Choose from styles like manga, anime, American comic, or customize your own art style."
    },
    step3: {
      title: "Step 3: AI Generation",
      content: "Click the 'Generate Comic' button. Wait for KomikoAI's AI comic generator to create panels, art, speech bubbles, and narration based on your inputs."
    },
    step4: {
      title: "Step 4: Export & Share",
      content: "Download high-quality comic outputs to share on social media or use for personal projects."
    }
  },
  why_use: {
    heading: "Why you should generate comics with AI Comic Generator",
    description: "KomikoAI's AI Comic Generator simplifies comic creation for everyone, from beginners to professionals, offering unmatched customization and accessibility.",
    features: {
      beginner_friendly: {
        title: "Beginner-Friendly",
        content: "No drawing skills? No problem! Just type in your idea and AI Comic Generator draws your comic for you in one click."
      },
      custom_art: {
        title: "Custom Art Styles",
        content: "Pick from art styles like American comic, manga, manhwa or anime, or customize your own art style by specifying it in prompts."
      },
      amazing_layouts: {
        title: "Amazing Layouts",
        content: "Generate comics with different layouts and panel arrangements to best tell your story."
      },
      tell_story: {
        title: "Tell Your Story",
        content: "Create compelling narratives with engaging characters and plot development."
      },
      ai_efficiency: {
        title: "AI Efficiency",
        content: "Advanced AI handles character design, panel layout, and artwork while you focus on the story."
      },
      high_quality: {
        title: "High Quality",
        content: "Professional-grade comics suitable for publishing, sharing, or commercial use."
      },
      creative_freedom: {
        title: "Creative Freedom",
        content: "Explore any genre, style, or concept. From comedy to drama, fantasy to sci-fi."
      },
      accessible: {
        title: "Accessible",
        content: "Web-based tool works on any device. Create comics on desktop, tablet, or mobile."
      },
      share_comics: {
        title: "Share Comics",
        content: "Download and share your comics instantly on social media or print them for physical distribution."
      }
    }
  },
  faq: {
    title: "Frequently Asked Questions",
    description: "Get answers to common questions about our AI comic generator and how to create amazing comics.",
    edit_after_creation: {
      question: "Can I edit the comic after it's generated?",
      answer: "Yes! After generation, you can click the 'Edit' button to modify your comic. You can adjust text, move speech bubbles, change colors, and add or remove elements to perfect your creation."
    },
    what_is_comic_generator: {
      question: "What is an AI Comic Generator?",
      answer: "An AI Comic Generator is a tool that uses artificial intelligence to create comic strips automatically. Simply provide your story idea, select your preferred art style, and the AI will generate a complete comic with panels, characters, dialogue, and artwork."
    },
    what_is_manga_generator: {
      question: "What is the AI Manga Generator?",
      answer: "AI Manga Generator is an innovative tool that uses AI to automatically generate manga. Enter your idea, choose the manga style, and let the AI generate a manga in seconds!"
    },
    what_is_manhwa_generator: {
      question: "What is the AI Manhwa Generator?",
      answer: "AI Manhwa Generator is an innovative tool that uses AI to automatically generate manhwa. Enter your idea, choose a manhwa style, and let the AI generate a manhwa in seconds!"
    },
    how_to_make_comics: {
      question: "How do I make comics with AI Comic Generator?",
      answer: "Making a comic with AI Comic Generator is super easy! Just type a story idea for your comic, and AI Comic Generator will turn your idea into an amazing comic."
    },
    how_it_works: {
      question: "How does the AI Comic Generator work?",
      answer: "Simply enter your idea or concept, select an art style (anime, manga, or custom style), and let KomikoAI's AI create a fully designed comic strip."
    },
    art_styles: {
      question: "What art styles are supported?",
      answer: "KomikoAI supports a range of styles, including anime, manga, American comics, and custom art styles based on your prompts."
    },
    what_comics_can_i_generate: {
      question: "What kind of comics can I generate with AI Comic Generator?",
      answer: "You can generate any type of comic, manga, manhwa. Superhero stories, Japanese anime, isekai, regression, shounen, shoujo, seinen, any kind of story you can imagine."
    },
    commercial_use: {
      question: "Can I use the generated comics commercially?",
      answer: "Yes! Comics created with KomikoAI can be used for personal or commercial purposes, subject to our terms of service."
    },
    need_drawing_skills: {
      question: "Do I need to know how to draw to use the AI Comic Generator?",
      answer: "Not at all! KomikoAI's AI Comic Generator is designed for everyone, from professional artists to complete beginners."
    },
    for_memes: {
      question: "Can I use the AI Comic Generator for memes?",
      answer: "Absolutely! KomikoAI's AI Comic Generator is perfect for creating hilarious and viral memes. Just select the \"Meme\" mode and let the AI do the work."
    },
    is_free: {
      question: "Is the AI Comic Generator free to use?",
      answer: "KomikoAI offers a free plan with limited zaps (credits). For more features and higher usage limits, check out our pricing plans."
    },
    share_online: {
      question: "Can I share my comics online?",
      answer: "Yes, you can download your comics and share them on social media platforms like Instagram, Twitter, and Facebook."
    },
    custom_art_styles: {
      question: "Can I create custom art styles with AI Comic Generator?",
      answer: "Yes, with KomikoAI's custom mode, you can specify your own art style, color schemes, and visual details to create unique comics."
    }
  },
  auto_post: "Auto Post",
  idea_input: {
    label: "Story Idea",
    placeholder: "Enter your story idea..."
  },
  login_to_generate: "Login to Generate",
  comics_generated: "Over {{count}} comics generated and counting!"
}

export async function loadServerTranslation(locale: string = 'en'): Promise<TranslationData> {
  try {
    const translationPath = path.join(process.cwd(), 'src', 'i18n', 'locales', locale, 'ai-comic-generator.json')

    if (fs.existsSync(translationPath)) {
      const translationContent = fs.readFileSync(translationPath, 'utf8')
      const translation = JSON.parse(translationContent)

      // 合并翻译内容和默认值，确保所有字段都存在
      return mergeTranslations(defaultTranslation, translation)
    } else {
      console.warn(`Translation file not found for locale: ${locale}, using default (en)`)
      return defaultTranslation
    }
  } catch (error) {
    console.error(`Error loading translation for locale: ${locale}`, error)
    return defaultTranslation
  }
}

// 深度合并翻译内容，确保所有字段都存在
function mergeTranslations(defaultTrans: any, loadedTrans: any): any {
  if (typeof defaultTrans !== 'object' || typeof loadedTrans !== 'object') {
    return loadedTrans || defaultTrans
  }

  const result = { ...defaultTrans }

  for (const key in loadedTrans) {
    if (loadedTrans[key] && typeof loadedTrans[key] === 'object' && !Array.isArray(loadedTrans[key])) {
      result[key] = mergeTranslations(defaultTrans[key] || {}, loadedTrans[key])
    } else {
      result[key] = loadedTrans[key]
    }
  }

  return result
}