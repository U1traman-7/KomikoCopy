#!/usr/bin/env node

// Migration script to convert variant i18n files from old structure to new structure
// Migrates files in src/i18n/locales/[locale]/variants/playground/[variant].json
// Old structure matches src/data/variants/playground old format
// New structure matches src/data/variants/playground new format

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');

// Convert FAQ array to q1/a1 format
function convertFaqArray(faqArray) {
  if (!Array.isArray(faqArray)) return {};
  
  const faqObj = {};
  faqArray.forEach((faq, index) => {
    const num = index + 1;
    faqObj[`q${num}`] = faq.question;
    faqObj[`a${num}`] = faq.answer;
  });
  
  return faqObj;
}

// Migrate a single variant i18n file
function migrateVariantFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const oldData = JSON.parse(content);
    
    // Check if already migrated (has seo.meta structure)
    if (oldData.seo && oldData.seo.meta) {
      return { success: true, skipped: true };
    }
    
    // Check if it has the old structure
    if (!oldData.content) {
      return { success: false, error: 'No content field' };
    }
    
    // Build new structure
    const newData = {
      seo: {
        meta: {
          title: oldData.seo?.title || oldData.content?.header?.title || 'Untitled',
          description: oldData.seo?.description || oldData.content?.header?.subtitle || '',
          keywords: oldData.seo?.keywords || '',
        },
        hero: {
          title: oldData.content?.header?.title || 'Untitled',
        },
      },
      config: oldData.config || {},
    };

    // Preserve top-level fields
    if (oldData.placeholderText) {
      newData.placeholderText = oldData.placeholderText;
    }
    if (oldData.originalKeyword) {
      newData.originalKeyword = oldData.originalKeyword;
    }
    if (oldData.defaultStyle) {
      newData.defaultStyle = oldData.defaultStyle;
    }
    
    // Add whatIs section if exists
    if (oldData.content?.sections?.whatIs) {
      newData.seo.whatIs = {
        title: oldData.content.sections.whatIs.title,
        description: oldData.content.sections.whatIs.description,
      };
    }
    
    // Add examples section if exists
    if (oldData.content?.sections?.examples) {
      newData.seo.examples = {
        title: oldData.content.sections.examples.title,
        description: oldData.content.sections.examples.subtitle || '',
      };
    }
    
    // Add howToUse section if exists
    if (oldData.content?.sections?.howToUse) {
      newData.seo.howToUse = {
        title: oldData.content.sections.howToUse.title,
        steps: oldData.content.sections.howToUse.steps || [],
      };
      
      // Add subtitle if exists
      if (oldData.content.sections.howToUse.subtitle) {
        newData.seo.howToUse.subtitle = oldData.content.sections.howToUse.subtitle;
      }
    }
    
    // Add benefits section (was whyUse)
    if (oldData.content?.sections?.whyUse) {
      newData.seo.benefits = {
        title: oldData.content.sections.whyUse.title,
        description: oldData.content.sections.whyUse.subtitle || '',
        features: oldData.content.sections.whyUse.features || [],
      };
    }
    
    // Add FAQ section
    if (oldData.content?.faq && Array.isArray(oldData.content.faq) && oldData.content.faq.length > 0) {
      newData.seo.faq = {
        title: oldData.content.sections?.faq?.title || `${oldData.content?.header?.title || 'Tool'} FAQ`,
        description: oldData.content.sections?.faq?.description || '',
        ...convertFaqArray(oldData.content.faq)
      };
    }
    
    // Add CTA section if exists
    if (oldData.content?.cta) {
      newData.seo.cta = oldData.content.cta;
    }
    
    // Add examples array
    newData.examples = oldData.content?.examples || [];
    
    // Write the migrated file (no backup)
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    
    return { success: true, skipped: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all locale directories
function getLocales() {
  return fs.readdirSync(LOCALES_DIR).filter(item => {
    const itemPath = path.join(LOCALES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });
}

// Main migration function
function migrateAllVariantI18n() {
  console.log('🚀 Starting variant i18n files migration...\n');
  
  const locales = getLocales();
  console.log(`📊 Found ${locales.length} locales\n`);
  
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    total: 0,
  };
  
  const failedFiles = [];
  
  locales.forEach(locale => {
    const variantsDir = path.join(LOCALES_DIR, locale, 'variants', 'playground');
    
    if (!fs.existsSync(variantsDir)) {
      return;
    }
    
    const files = fs.readdirSync(variantsDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      return;
    }
    
    console.log(`\n📁 Processing locale: ${locale} (${files.length} files)`);
    
    files.forEach(file => {
      const filePath = path.join(variantsDir, file);
      const result = migrateVariantFile(filePath);
      
      results.total++;
      
      if (result.success) {
        if (result.skipped) {
          console.log(`  ⏭️  ${file}: Already migrated`);
          results.skipped++;
        } else {
          console.log(`  ✅ ${file}: Migrated`);
          results.success++;
        }
      } else {
        console.log(`  ❌ ${file}: ${result.error}`);
        results.failed++;
        failedFiles.push({ locale, file, error: result.error });
      }
    });
  });
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully migrated: ${results.success}`);
  console.log(`⏭️  Skipped (already migrated): ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📁 Total files processed: ${results.total}`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n⚠️  Failed files:');
    failedFiles.forEach(({ locale, file, error }) => {
      console.log(`  - ${locale}/${file}: ${error}`);
    });
  } else {
    console.log('\n🎉 Migration completed successfully!');
  }
}

// Run migration
migrateAllVariantI18n();

