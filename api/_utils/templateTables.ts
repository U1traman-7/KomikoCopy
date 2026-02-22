/**
 * 模板相关表名映射
 *
 * .env 中设置 USE_TEST_TEMPLATES=true 时使用 test_ 前缀的测试表，
 * 否则使用正式表。
 *
 * 用法:
 *   import { T } from '../_utils/templateTables.js';
 *   supabase.from(T.style_templates).select(...)
 */

const useTest = process.env.USE_TEST_TEMPLATES === 'true';
const prefix = useTest ? 'test_' : '';

export const T = {
  style_templates: `${prefix}style_templates`,
  template_categories: `${prefix}template_categories`,
  template_category_relations: `${prefix}template_category_relations`,
  template_character_inputs: `${prefix}template_character_inputs`,
} as const;
