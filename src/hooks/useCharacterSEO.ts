import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export const useCharacterSEO = () => {
  const { t } = useTranslation('character');

  // 提取角色关键词 - 使用 useMemo 缓存结果
  const extractCharacterKeywords = useMemo(
    () => (char: any) => {
      if (
        !char ||
        char.character_uniqid === 'loading...' ||
        char.character_name === 'Character not found'
      ) {
        return t('keyword_oc') + ', ' + t('keyword_ai_character');
      }

      const keywordItems: string[] = [t('keyword_oc')];

      // 添加角色名称
      if (char.character_name && char.character_name !== 'loading...') {
        keywordItems.push(char.character_name);
      }

      // 添加性别
      if (char.gender && char.gender !== 'loading...') {
        const gender = char.gender.trim().toLowerCase();
        if (gender === 'male') {
          keywordItems.push(t('keyword_male_character'));
        } else if (gender === 'female') {
          keywordItems.push(t('keyword_female_character'));
        }
      }

      // 添加年龄
      if (char.age && char.age !== 'loading...') {
        const age = parseInt(char.age);
        if (age < 18) {
          keywordItems.push(t('keyword_teen'));
        } else if (age >= 18 && age <= 30) {
          keywordItems.push(t('keyword_young_adult'));
        }
      }

      // 添加职业
      if (char.profession && char.profession !== 'loading...') {
        const professions = char.profession
          .split(',')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 2)
          .slice(0, 1);

        if (professions.length > 0) {
          keywordItems.push(professions[0]);
        }
      }

      // 添加AI相关关键词
      keywordItems.push(t('keyword_ai_character'));

      const keywords = [...new Set(keywordItems)].join(', ');
      return keywords.length > 100
        ? keywords.substring(0, 97) + '...'
        : keywords;
    },
    [t],
  );

  // 生成优化的页面描述 - 使用 useMemo 缓存结果
  const generatePageDescription = useMemo(
    () => (char: any) => {
      if (
        !char ||
        char.character_uniqid === 'loading...' ||
        char.character_name === 'Character not found'
      ) {
        return (
          t('characterPageDefault') ||
          'Discover AI-generated characters on KomikoAI. Create, share and explore unique anime characters.'
        );
      }

      const parts: string[] = [];

      // 基础介绍
      if (char.intro && char.intro !== 'loading...') {
        parts.push(char.intro.substring(0, 120));
      }

      // 添加角色信息
      const charInfo: string[] = [];
      if (char.gender && char.gender !== 'loading...')
        charInfo.push(`${t('gender')}: ${char.gender}`);
      if (char.age && char.age !== 'loading...')
        charInfo.push(`${t('age')}: ${char.age}`);
      if (char.profession && char.profession !== 'loading...')
        charInfo.push(`${t('profession')}: ${char.profession}`);

      if (charInfo.length > 0) {
        parts.push(charInfo.join(', '));
      }

      // 添加个性特征
      if (char.personality && char.personality !== 'loading...') {
        parts.push(`${t('personality')}: ${char.personality.substring(0, 80)}`);
      }

      const description = parts.join(' | ');
      return description.length > 155
        ? description.substring(0, 152) + '...'
        : description;
    },
    [t],
  );

  // 生成结构化数据 - 使用 useMemo 缓存结果
  const generateStructuredData = useMemo(
    () => (char: any) => {
      if (!char || char.character_uniqid === 'loading...') return null;

      return {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `https://komiko.app/character/${char.character_uniqid}`,
        name: char.character_name,
        description: generatePageDescription(char),
        image: {
          '@type': 'ImageObject',
          url: char.character_pfp,
          width: 300,
          height: 400,
        },
        creator: {
          '@type': 'Person',
          name: char.user_name || 'KomikoAI User',
        },
        dateCreated: char.created_at,
        genre: 'AI Generated Character',
        keywords: extractCharacterKeywords(char),
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Gender',
            value: char.gender || 'Unknown',
          },
          {
            '@type': 'PropertyValue',
            name: 'Age',
            value: char.age || 'Unknown',
          },
          {
            '@type': 'PropertyValue',
            name: 'Profession',
            value: char.profession || 'Unknown',
          },
        ],
        publisher: {
          '@type': 'Organization',
          name: 'KomikoAI',
          url: 'https://komiko.app',
        },
      };
    },
    [generatePageDescription],
  );

  return {
    extractCharacterKeywords,
    generatePageDescription,
    generateStructuredData,
  };
};
