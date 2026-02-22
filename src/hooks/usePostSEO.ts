import { useTranslation } from 'react-i18next';

export const usePostSEO = () => {
  const { t } = useTranslation(['post', 'seo']);

  // 确定内容类型
  const getContentType = (post: any) => {
    if (!post) return { type: 'unknown', prefix: '' };

    // 使用 media_type 字段作为主要指标
    if (post.media_type === 'video') {
      return {
        type: 'video',
        prefix: t('post:aiAnimation'),
      };
    }

    // 使用 media 数组作为次要指标
    if (post.media) {
      // 检查视频格式
      if (
        post.media.some(
          (url: string) => url.includes('.mp4') || url.includes('video'),
        )
      ) {
        return {
          type: 'video',
          prefix: t('post:aiAnimation'),
        };
      }

      // 多张图片 = 漫画
      if (post.media.length > 1) {
        return {
          type: 'comic',
          prefix: t('post:aiComic'),
        };
      }

      // 单张图片 = 艺术
      return {
        type: 'image',
        prefix: t('post:aiArt'),
      };
    }

    return { type: 'unknown', prefix: '' };
  };

  // 从generations中获取prompt
  const getPromptFromGenerations = (post: any) => {
    if (post?.generations && post.generations.length > 0) {
      const prompt = post.generations[0].prompt || '';
      // 清理prompt，移除质量修饰词
      return prompt.split(
        /,\s*(best quality|4k|masterpiece|high quality|detailed)/i,
      )[0];
    }
    return '';
  };

  // 提取关键词
  const extractKeywords = (prompt: string, modelName?: string) => {
    if (!prompt) return '';

    // 删除质量修饰词和不相关内容
    const cleanPrompt = prompt
      .replace(
        /best quality|4k|masterpiece|high quality|detailed|amazing quality|rating: general/gi,
        '',
      )
      .replace(/\n/g, ' ');

    // 提取关键对象和特征
    const importantElements: string[] = [];

    // 1. 提取明显的主体对象
    const subjectMatches = cleanPrompt.match(
      /(?:a|the)\s+([a-z-]+\s+[a-z-]+\s+[a-z-]+|[a-z-]+\s+[a-z-]+|[a-z-]+)/gi,
    );
    if (subjectMatches) {
      const subjects = subjectMatches
        .map(match => match.replace(/^(a|the)\s+/i, '').trim())
        .filter(
          s =>
            s.length > 3 && !s.match(/^(with|and|that|this|from|into|over)$/i),
        )
        .slice(0, 3);

      importantElements.push(...subjects);
    }

    // 2. 提取关键特征和元素
    const keyVisualElements: string[] = [
      'tattoo',
      'snake',
      'dragon',
      'sword',
      'magic',
      'forest',
      'castle',
      'mountain',
      'ocean',
      'galaxy',
      'mystical',
      'fantasy',
      'scifi',
      'futuristic',
      'ancient',
      'cyberpunk',
      'steampunk',
      'portrait',
    ];

    keyVisualElements.forEach(element => {
      if (cleanPrompt.toLowerCase().includes(element)) {
        importantElements.push(element);
      }
    });

    // 3. 提取颜色关键词
    const colorMatches = cleanPrompt.match(
      /\b(red|blue|green|purple|pink|black|white|golden|silver)\b/gi,
    );
    if (colorMatches && colorMatches.length > 0) {
      importantElements.push(...colorMatches.slice(0, 2));
    }

    // 4. 提取艺术风格
    const styleMatches = cleanPrompt.match(
      /\b(anime|cartoon|realistic|painting|illustration|portrait|concept art)\b/gi,
    );
    if (styleMatches) {
      importantElements.push(...styleMatches);
    }

    // 5. 添加生成模型作为关键词
    if (modelName) {
      importantElements.push(modelName);
    }

    // 去重并限制关键词数量和总长度
    const uniqueKeywords = [...new Set(importantElements)];
    let finalKeywords = '';
    let currentLength = 0;

    for (const keyword of uniqueKeywords) {
      if (currentLength + keyword.length + 2 > 95) break;
      finalKeywords += finalKeywords ? ', ' + keyword : keyword;
      currentLength += keyword.length + 2;
    }

    return finalKeywords;
  };

  // 提取OC角色关键词
  const extractOCKeywords = (post: any) => {
    if (!post?.content) return '';

    const keywordItems: string[] = [
      'original character',
      'oc',
      'oc-maker',
      'character design',
    ];

    // 提取角色名称
    const nameMatch = post.content.match(/Name:\s*([^,\n]+)/i);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      keywordItems.push(name);
      keywordItems.push(`${name} character`);
    }

    // 提取性别
    const genderMatch = post.content.match(/Gender:\s*([^,\n]+)/i);
    if (genderMatch && genderMatch[1]) {
      const gender = genderMatch[1].trim().toLowerCase();
      if (gender === 'male') {
        keywordItems.push('male character', 'male oc');
      } else if (gender === 'female') {
        keywordItems.push('female character', 'female oc');
      }
    }

    // 提取年龄
    const ageMatch = post.content.match(/Age:\s*(\d+)/i);
    if (ageMatch && ageMatch[1]) {
      const age = parseInt(ageMatch[1]);
      if (age < 18) {
        keywordItems.push('teen character');
      } else if (age >= 18 && age <= 30) {
        keywordItems.push('young adult character');
      } else {
        keywordItems.push('adult character');
      }
    }

    // 提取职业
    const profMatch = post.content.match(/Profession:\s*([^,\n]+)/i);
    if (profMatch && profMatch[1]) {
      const professions = profMatch[1]
        .trim()
        .toLowerCase()
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 3 && !/^\d+$/.test(p))
        .slice(0, 3);

      keywordItems.push(...professions);
    }

    // 提取个性特征
    const personalityMatch = post.content.match(/Personality:\s*([^,\n]+)/i);
    if (personalityMatch && personalityMatch[1]) {
      const traits = personalityMatch[1]
        .trim()
        .toLowerCase()
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 3 && !/^\d+$/.test(p))
        .slice(0, 3);

      keywordItems.push(...traits);
    }

    return [...new Set(keywordItems)].join(', ');
  };

  // 提取视频关键词
  const extractVideoKeywords = (post: any) => {
    if (!post) return '';

    const keywordItems: string[] = ['ai animation', 'digital animation'];

    // 添加动画风格关键词
    if (post.title) {
      const title = post.title.toLowerCase();

      // 常见动画动作
      const actionWords = [
        'moves',
        'stares',
        'walks',
        'runs',
        'jumps',
        'dances',
        'talks',
        'speaks',
        'smiles',
        'laughs',
      ];
      let actionMatches = 0;

      for (const action of actionWords) {
        if (title.includes(action) && actionMatches < 2) {
          keywordItems.push(`${action} animation`);

          if (action === 'moves') keywordItems.push('character movement');
          else if (action === 'stares') keywordItems.push('facial animation');
          else if (action === 'dances') keywordItems.push('dance animation');
          else if (action === 'talks' || action === 'speaks')
            keywordItems.push('talking character');

          actionMatches++;
        }
      }

      if (title.includes('camera')) keywordItems.push('camera interaction');
      else if (title.includes('loop')) keywordItems.push('seamless loop');
      else if (title.includes('walk cycle'))
        keywordItems.push('character walk');
    }

    if (post.content) {
      const contentWords = post.content
        .toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3);

      const possibleSubjects = contentWords
        .filter(
          (word: string) =>
            word.length > 3 &&
            /^[A-Za-z]+$/.test(word) &&
            !['this', 'that', 'with', 'from'].includes(word),
        )
        .slice(0, 1);

      if (possibleSubjects.length > 0) {
        keywordItems.push(`${possibleSubjects[0]} animation`);
      }
    }

    keywordItems.push('ai-generated animation');
    return [...new Set(keywordItems)].slice(0, 10).join(', ');
  };

  // 判断是否为OC
  const isOCPost = (post: any) => {
    return (
      post &&
      ((post.title && post.title.toLowerCase().includes('oc')) ||
        (post.content &&
          post.content.includes('Name:') &&
          post.content.includes('Gender:')))
    );
  };

  // 判断是否为视频
  const isVideoPost = (post: any) => {
    return (
      post &&
      (post.media_type === 'video' ||
        (post.media &&
          post.media.some(
            (url: string) => url.includes('.mp4') || url.includes('video'),
          )))
    );
  };

  // 生成默认描述
  const getDefaultDescription = (post: any, contentType: { type: string }) => {
    const userName = post?.user_name || 'KomikoAI user';
    const title = post?.title || '';

    if (contentType.type === 'video') {
      return t('post:defaultVideoDescription', { title, name: userName });
    } else if (contentType.type === 'comic') {
      return t('post:defaultComicDescription', { title, name: userName });
    } else {
      return t('post:defaultImageDescription', { title, name: userName });
    }
  };

  // 截断文本到指定长度
  const truncateToLength = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // 提取post tags关键词
  const extractPostTagsKeywords = (post: any) => {
    if (!post?.post_tags || !Array.isArray(post.post_tags)) return '';

    const tagNames = post.post_tags
      .map((tag: any) => tag.name)
      .filter((name: string) => name && typeof name === 'string')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0 && name.length <= 20) // 过滤过长的标签
      .slice(0, 5); // 减少标签数量

    return tagNames.join(', ');
  };

  // 生成页面关键词
  const generatePageKeywords = (post: any) => {
    const contentType = getContentType(post);
    const modelName = post?.generations?.[0]?.model || '';

    // 基础关键词（根据类型）
    let baseKeywords = '';

    if (contentType.type === 'video') {
      baseKeywords = t('post:video_keywords');
    } else if (isOCPost(post)) {
      baseKeywords = t('seo:character_keywords');
    } else {
      baseKeywords = t('post:post_keywords');
    }

    // 通用关键词
    const commonKeywords = t('common_keywords');

    // 添加标题作为关键词（限制长度）
    const titleKeyword = post?.title
      ? post.title
          .replace(/[^\w\s]/gi, ' ')
          .trim()
          .substring(0, 30)
      : '';

    // 添加AI模型名称
    const modelKeyword = modelName ? modelName : '';

    // 添加post tags关键词（限制数量）
    const postTagsKeywords = extractPostTagsKeywords(post);

    // 组合所有关键词并去重
    let allKeywords = [commonKeywords, baseKeywords];
    if (titleKeyword) allKeywords.push(titleKeyword);
    if (modelKeyword) allKeywords.push(modelKeyword);
    if (postTagsKeywords) allKeywords.push(postTagsKeywords);

    const uniqueKeywords = new Set(
      allKeywords
        .filter(Boolean)
        .join(', ')
        .split(', ')
        .map(k => k.trim())
        .filter(k => k),
    );

    // 限制总长度，特别是comic类型
    const keywordArray = Array.from(uniqueKeywords);
    let result = '';
    let currentLength = 0;
    const maxLength = contentType.type === 'comic' ? 100 : 120;

    for (const keyword of keywordArray) {
      const addLength = result ? keyword.length + 2 : keyword.length;
      if (currentLength + addLength > maxLength) break;

      result += result ? ', ' + keyword : keyword;
      currentLength += addLength;
    }

    return result;
  };

  // 生成页面描述
  const generatePageDescription = (post: any) => {
    if (!post) return t('post:postNotFound');

    const contentType = getContentType(post);
    const promptText = getPromptFromGenerations(post);
    const modelName = post?.generations?.[0]?.model || '';

    const baseDescription =
      post.content || promptText || getDefaultDescription(post, contentType);

    const additionalContext =
      post.user_name && !baseDescription.includes(post.user_name)
        ? ` ${t('post:createdByWithName', { name: post.user_name, model: modelName || t('aiTechnology') })}.`
        : '';

    return truncateToLength(baseDescription + additionalContext, 160);
  };

  // 生成页面标题
  const generatePageTitle = (post: any, platformName = 'KomikoAI') => {
    if (!post) return t('post:postNotFound') + ` | ${platformName}`;

    const contentType = getContentType(post);
    const maxTitleLength =
      60 - contentType.prefix.length - platformName.length - 4; // 减去分隔符长度
    const truncatedTitle =
      post.title && post.title.length > maxTitleLength
        ? post.title.substring(0, maxTitleLength - 3) + '...'
        : post.title;

    return `${contentType.prefix}: ${truncatedTitle} | ${platformName}`;
  };

  // 生成结构化数据
  const generateStructuredData = (post: any) => {
    if (!post) return null;

    const pageDescription = generatePageDescription(post);

    return {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: post.title,
      description: pageDescription,
      image: post.media?.[0],
      author: {
        '@type': 'Person',
        name: post.user_name,
      },
      publisher: {
        '@type': 'Organization',
        name: 'KomikoAI',
      },
      dateCreated: post.created_at,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.votes || 0,
      },
    };
  };

  return {
    getContentType,
    getPromptFromGenerations,
    extractKeywords,
    extractOCKeywords,
    extractVideoKeywords,
    extractPostTagsKeywords,
    isOCPost,
    isVideoPost,
    getDefaultDescription,
    truncateToLength,
    generatePageKeywords,
    generatePageDescription,
    generatePageTitle,
    generateStructuredData,
  };
};
