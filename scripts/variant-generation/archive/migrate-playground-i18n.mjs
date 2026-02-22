#!/usr/bin/env node

/**
 * Migration script to convert playground.json and photo-to-anime.json i18n files
 * from old structure to new structure for all languages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const BACKUP_DIR = path.join(__dirname, '../src/i18n/locales-backup');

// Get all locale directories
function getLocales() {
  return fs.readdirSync(LOCALES_DIR).filter(item => {
    const itemPath = path.join(LOCALES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });
}

// Migrate playground.json for a specific locale
function migratePlaygroundJson(localePath, locale) {
  const filePath = path.join(localePath, 'playground.json');
  
  if (!fs.existsSync(filePath)) {
    return { success: true, skipped: true, reason: 'File not found' };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const oldData = JSON.parse(content);
    
    // Check if already migrated (has ui and seo structure)
    if (oldData.ui && oldData.seo && oldData.seo.meta) {
      return { success: true, skipped: true, reason: 'Already migrated' };
    }
    
    // Build new structure
    const newData = {
      ui: {
        title: oldData.title || 'AI Playground: Convert to Anime, Manga, Manhwa, or Comic',
        infoTooltip: oldData.infoTooltip || '',
        styleSelection: oldData.styleSelection || { label: 'Choose Art Style' },
        styleModes: oldData.ui?.styleModes || {
          templates: 'Templates',
          prompt: 'Prompt',
          expression: 'Expressions',
        },
        prompt: oldData.ui?.prompt || {
          placeholder: 'Describe your desired style transformation...',
          example: 'Example: "Replace the man with Naruto", "Turn this into a classic 90s anime style", "Dress the girl in a floral dress"',
        },
        button: oldData.button || {
          convert: 'Convert to {{style}}',
          zaps: '-{{cost}}/{{credit}}',
          applyPrompt: 'Apply Prompt',
        },
        results: oldData.results || {
          title: 'Your AI Anime, Manga, Manhwa & Comic Conversions',
          empty: 'Converted artworks will appear here. Generate stunning anime, manga, manhwa, and comic art instantly!',
        },
        deleteModal: oldData.deleteModal || {
          title: 'Delete Artwork',
          message: 'Are you sure you want to delete this image? This action cannot be undone.',
          cancel: 'Cancel',
          delete: 'Delete',
        },
        toast: oldData.toast || {},
        errors: oldData.errors || {},
        styles: oldData.styles || {},
        styleDescriptions: oldData.styleDescriptions || {},
      },
      seo: {
        meta: {
          title: oldData.meta?.title || oldData.hero?.title || 'AI Playground',
          description: oldData.meta?.description || oldData.hero?.description || '',
          keywords: oldData.meta?.keywords || '',
        },
        hero: {
          title: oldData.hero?.title || 'AI Playground',
        },
        whatIs: {
          title: 'What is AI Playground?',
          description: oldData.hero?.description || '',
        },
        examples: {
          title: oldData.examples?.title || 'AI Playground Examples',
          description: '',
        },
        howToUse: {
          title: oldData.howItWorks?.title || 'How to Use AI Playground',
          steps: [],
        },
        benefits: {
          title: oldData.benefits?.title || 'Why Use AI Playground?',
          description: '',
          features: [],
        },
        faq: {
          title: oldData.faqSection?.title || 'AI Playground FAQ',
          description: oldData.faqSection?.description || '',
        },
        cta: {
          title: 'Start Creating with AI Playground Today!',
          description: 'Transform your images into stunning anime, manga, and comic art with our advanced AI technology.',
          buttonText: 'Try AI Playground Free',
        },
      },
      examples: [],
    };
    
    // Convert howItWorks steps
    if (oldData.howItWorks) {
      const steps = [];
      for (let i = 1; i <= 10; i++) {
        const stepKey = `step${i}`;
        if (oldData.howItWorks[stepKey]) {
          steps.push({
            title: oldData.howItWorks[stepKey].title,
            content: oldData.howItWorks[stepKey].content,
          });
        }
      }
      newData.seo.howToUse.steps = steps;
    }
    
    // Convert benefits features
    if (oldData.benefits) {
      const features = [];
      for (let i = 1; i <= 10; i++) {
        const featureKey = `feature${i}`;
        if (oldData.benefits[featureKey]) {
          features.push({
            title: oldData.benefits[featureKey].title,
            content: oldData.benefits[featureKey].content,
            icon: oldData.benefits[featureKey].title.match(/^[^\s]+/)?.[0] || '✨',
          });
        }
      }
      newData.seo.benefits.features = features;
    }
    
    // Convert FAQ
    if (oldData.faq) {
      for (let i = 1; i <= 10; i++) {
        const questionKey = `question${i}`;
        const answerKey = `answer${i}`;
        if (oldData.faq[questionKey] && oldData.faq[answerKey]) {
          newData.seo.faq[`q${i}`] = oldData.faq[questionKey];
          newData.seo.faq[`a${i}`] = oldData.faq[answerKey];
        }
      }
    }
    
    // Write the migrated file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    
    return { success: true, skipped: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Migrate photo-to-anime.json for a specific locale
function migratePhotoToAnimeJson(localePath, locale) {
  const filePath = path.join(localePath, 'photo-to-anime.json');
  
  if (!fs.existsSync(filePath)) {
    return { success: true, skipped: true, reason: 'File not found' };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const oldData = JSON.parse(content);
    
    // Check if already migrated (only has ui section)
    if (oldData.ui && !oldData.meta && !oldData.hero && !oldData.howItWorks) {
      return { success: true, skipped: true, reason: 'Already migrated' };
    }
    
    // Keep only UI-related content
    const newData = {
      ui: oldData.ui || {
        styleModes: {
          templates: 'Templates',
          prompt: 'Prompt',
          expression: 'Expressions',
        },
        prompt: {
          placeholder: 'Describe your desired style transformation...',
          example: 'Example: "Replace the man with Naruto", "Turn this into a classic 90s anime style", "Dress the girl in a floral dress"',
        },
      },
    };
    
    // Write the migrated file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    
    return { success: true, skipped: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main migration function
function migrateAllLocales() {
  console.log('🚀 Starting i18n files migration...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
  }
  
  const locales = getLocales();
  console.log(`📊 Found ${locales.length} locales\n`);
  
  const results = {
    playground: { success: 0, skipped: 0, failed: 0 },
    photoToAnime: { success: 0, skipped: 0, failed: 0 },
  };
  
  locales.forEach(locale => {
    console.log(`\n📁 Processing locale: ${locale}`);
    const localePath = path.join(LOCALES_DIR, locale);
    const backupPath = path.join(BACKUP_DIR, locale);
    
    // Create backup directory for this locale
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Backup and migrate playground.json
    const playgroundFile = path.join(localePath, 'playground.json');
    if (fs.existsSync(playgroundFile)) {
      fs.copyFileSync(playgroundFile, path.join(backupPath, 'playground.json'));
      const result = migratePlaygroundJson(localePath, locale);
      
      if (result.success) {
        if (result.skipped) {
          console.log(`  ⏭️  playground.json: ${result.reason}`);
          results.playground.skipped++;
        } else {
          console.log('  ✅ playground.json: Migrated');
          results.playground.success++;
        }
      } else {
        console.log(`  ❌ playground.json: ${result.error}`);
        results.playground.failed++;
      }
    }
    
    // Backup and migrate photo-to-anime.json
    const photoToAnimeFile = path.join(localePath, 'photo-to-anime.json');
    if (fs.existsSync(photoToAnimeFile)) {
      fs.copyFileSync(photoToAnimeFile, path.join(backupPath, 'photo-to-anime.json'));
      const result = migratePhotoToAnimeJson(localePath, locale);
      
      if (result.success) {
        if (result.skipped) {
          console.log(`  ⏭️  photo-to-anime.json: ${result.reason}`);
          results.photoToAnime.skipped++;
        } else {
          console.log('  ✅ photo-to-anime.json: Migrated');
          results.photoToAnime.success++;
        }
      } else {
        console.log(`  ❌ photo-to-anime.json: ${result.error}`);
        results.photoToAnime.failed++;
      }
    }
  });
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log('\nplayground.json:');
  console.log(`  ✅ Successfully migrated: ${results.playground.success}`);
  console.log(`  ⏭️  Skipped: ${results.playground.skipped}`);
  console.log(`  ❌ Failed: ${results.playground.failed}`);
  console.log('\nphoto-to-anime.json:');
  console.log(`  ✅ Successfully migrated: ${results.photoToAnime.success}`);
  console.log(`  ⏭️  Skipped: ${results.photoToAnime.skipped}`);
  console.log(`  ❌ Failed: ${results.photoToAnime.failed}`);
  console.log('='.repeat(60));
  
  const totalFailed = results.playground.failed + results.photoToAnime.failed;
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Some files failed to migrate. Check the logs above for details.');
    console.log(`💾 Backups are available in: ${BACKUP_DIR}`);
  } else {
    console.log('\n🎉 Migration completed successfully!');
    console.log(`💾 Backups are available in: ${BACKUP_DIR}`);
  }
}

// Run migration
migrateAllLocales();

