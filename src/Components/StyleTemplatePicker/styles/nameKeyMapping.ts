import type { styleTemplate } from './index';

// Extract style name key mapping from template categories
export const extractStyleNameKeyMapping = (
  styleTemplates: styleTemplate[],
) => {
  const mapping: Record<string, string> = {};

  styleTemplates.forEach(category => {
    category.templates.forEach(template => {
      mapping[template.id] = template.nameKey;
    });
  });

  return mapping;
};

// Effect name key mapping cache - initialized empty, populated when video templates load
let effectNameKeyMappingCache: Record<string, string> = {};

// Function to update effect name key mapping when templates change
// This should be called whenever effectTemplatesCache is updated
export const updateEffectNameKeyMapping = (
  templates?: styleTemplate[],
): void => {
  if (templates && templates.length > 0) {
    effectNameKeyMappingCache = extractStyleNameKeyMapping(templates);
  }
};

// Synchronous getter for accessing latest cached mapping
export const getEffectNameKeyMappingSync = () => effectNameKeyMappingCache;
