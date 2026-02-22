#!/usr/bin/env node

/**
 * Migration script to convert playground variants from old structure to new structure
 * 
 * Old structure:
 * {
 *   "seo": { title, description, keywords },
 *   "content": {
 *     "header": { title, subtitle },
 *     "sections": { whatIs, howToUse, whyUse, examples, faq },
 *     "examples": [...],
 *     "faq": [...],
 *     "cta": {...}
 *   },
 *   "config": {...}
 * }
 * 
 * New structure (like video-to-video):
 * {
 *   "seo": {
 *     "meta": { title, description, keywords },
 *     "hero": { title },
 *     "whatIs": { title, description },
 *     "examples": { title, description },
 *     "howToUse": { title, steps: [] },
 *     "benefits": { title, description, features: [] },
 *     "faq": { title, description, q1, a1, q2, a2, ... },
 *     "cta": { title, description, buttonText }
 *   },
 *   "examples": [...],
 *   "config": {...}
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VARIANTS_DIR = path.join(__dirname, '../src/data/variants/playground');
const BACKUP_DIR = path.join(__dirname, '../src/data/variants/playground-backup');

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

// Migrate a single variant file
function migrateVariant(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const oldData = JSON.parse(content);
    
    // Check if already migrated (has seo.meta structure)
    if (oldData.seo && oldData.seo.meta) {
      console.log('  ✅ Already migrated, skipping...');
      return { success: true, skipped: true };
    }
    
    // Check if it has the old structure
    if (!oldData.content) {
      console.log('  ⚠️  No content field found, might be a different format');
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
    
    // Write the migrated file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log('  ✅ Successfully migrated');
    
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main migration function
function migrateAllVariants() {
  console.log('🚀 Starting playground variants migration...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
  }
  
  // Get all JSON files in variants directory
  if (!fs.existsSync(VARIANTS_DIR)) {
    console.error(`❌ Variants directory not found: ${VARIANTS_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(VARIANTS_DIR).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️  No variant files found');
    return;
  }
  
  console.log(`📊 Found ${files.length} variant files\n`);
  
  // Backup all files first
  console.log('💾 Creating backups...');
  files.forEach(file => {
    const sourcePath = path.join(VARIANTS_DIR, file);
    const backupPath = path.join(BACKUP_DIR, file);
    fs.copyFileSync(sourcePath, backupPath);
  });
  console.log('✅ Backups created\n');
  
  // Migrate each file
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
  };
  
  files.forEach(file => {
    const filePath = path.join(VARIANTS_DIR, file);
    const result = migrateVariant(filePath);
    
    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.success++;
      }
    } else {
      results.failed++;
    }
  });
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Successfully migrated: ${results.success}`);
  console.log(`⏭️  Skipped (already migrated): ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📁 Total files: ${files.length}`);
  console.log('='.repeat(50));
  
  if (results.failed > 0) {
    console.log('\n⚠️  Some files failed to migrate. Check the logs above for details.');
    console.log(`💾 Backups are available in: ${BACKUP_DIR}`);
  } else {
    console.log('\n🎉 Migration completed successfully!');
    console.log(`💾 Backups are available in: ${BACKUP_DIR}`);
  }
}

// Run migration
migrateAllVariants();

