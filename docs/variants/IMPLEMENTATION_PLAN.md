# Variant Page Generation Standardization - Implementation Plan

## Overview
Standardize and simplify the variant page generation process across all tool types (video-to-video, playground, image-animation-generator) with consistent structure, improved SEO, and automated workflows.

## Standard Output Structure

Based on `src/data/variants/playground/naruto-ai-filter.json`, all variant pages should follow this structure:

```json
{
  "seo": {
    "meta": {
      "title": "Tool Name",
      "description": "150-160 character description",
      "keywords": "keyword1, keyword2, keyword3"
    },
    "hero": {
      "title": "Tool Name"
    },
    "whatIs": {
      "title": "What is Tool Name?",
      "description": "Detailed description"
    },
    "examples": {
      "title": "Tool Name Examples",
      "description": "Examples description"
    },
    "howToUse": {
      "title": "How to Use The Tool Name",
      "steps": [
        {"title": "Step 1", "content": "..."},
        {"title": "Step 2", "content": "..."},
        {"title": "Step 3", "content": "..."},
        {"title": "Step 4", "content": "..."}
      ],
      "subtitle": "Optional subtitle"
    },
    "benefits": {
      "title": "Why Use The Tool Name",
      "description": "Benefits overview",
      "features": [
        {"title": "Feature 1", "content": "...", "icon": "🎨"},
        {"title": "Feature 2", "content": "...", "icon": "⚡"},
        {"title": "Feature 3", "content": "...", "icon": "✨"},
        {"title": "Feature 4", "content": "...", "icon": "🎯"},
        {"title": "Feature 5", "content": "...", "icon": "👌"},
        {"title": "Feature 6", "content": "...", "icon": "🚀"}
      ]
    },
    "faq": {
      "title": "Tool Name FAQ",
      "description": "FAQ section description",
      "q1": "What is XXX?",
      "a1": "XXX is an AI tool that...",
      "q2": "How to XXX?",
      "a2": "Using XXX is simple! First...",
      "q3": "How does XXX work?",
      "a3": "XXX uses ... technology to...",
      "q4": "What is the best XXX?",
      "a4": "KomikoAI provides the best XXX tool...",
      "q5": "Is the KomikoAI XXX free online?",
      "a5": "Yes, you can test out the XXX...",
      "q6": "What can I do with XXX?",
      "a6": "You can use XXX on KomikoAI to create...",
      "q7": "Can I use XXX on my phone?",
      "a7": "Yes, you can use XXX as a web app...",
      "q8": "Can I download my generation from XXX?",
      "a8": "Yes, KomikoAI's XXX allows you to export...",
      "q9": "Why should I use XXX?",
      "a9": "Using XXX can ... Our XXX allows you to..."
    },
    "cta": {
      "title": "Transform for FREE with Our Tool Name Today!",
      "description": "Motivational call-to-action message",
      "buttonText": "Try Our Tool Name Free"
    }
  },
  "config": {},
  "placeholderText": "Generate ... style artwork",
  "originalKeyword": "Tool Name",
  "defaultStyle": "style-name",
  "examples": [],
  "pageStructure": ["whatIs", "examples", "howToUse", "whyUse", "moreAITools", "faq", "cta"]
}
```

## Key Changes

### 1. Standardized Section Headings (SEO-Friendly)
- **How to Use**: "How to Use The [Tool Name]"
- **Examples**: "[Tool Name] Examples"
- **Benefits**: "Why Use The [Tool Name]"
- **FAQ**: "[Tool Name] FAQ"

### 2. Standardized FAQ Structure (9 Questions)
All variants must include exactly 9 FAQ questions following the specified pattern. The "XXX" placeholder should be a grammatically correct theme-related term (not just the tool name).

### 3. Content Structure Randomization
To avoid content farm detection, randomize the `pageStructure` array:
- **Rules**:
  - `examples` must appear in position 0 or 1
  - `whatIs` should be in first 2 positions (SEO)
  - `moreAITools` and `cta` always at the end
  - Shuffle remaining sections: `howToUse`, `whyUse`, `faq`

### 4. Examples Generation Strategy
Each tool config should specify how examples are generated:

```javascript
// In tool-configs/{toolType}/config.mjs
export const examplesStrategy = {
  type: 'api-batch' | 'video-pool' | 'comparison-videos',
  count: 4,
  
  // For 'api-batch' (playground):
  inputImages: [
    '/images/examples/photo-to-anime/input1.jpg',
    '/images/examples/photo-to-anime/input2.jpg',
    '/images/examples/photo-to-anime/input3.jpg',
    '/images/examples/photo-to-anime/input4.jpg'
  ],
  
  // For 'video-pool' (image-animation-generator):
  videoPool: [...], // From existing examples array
  
  // For 'comparison-videos' (video-to-video):
  comparisonPairs: [
    {
      input: '/images/examples/video-to-video/input1.webm',
      output: '/images/examples/video-to-video/output1.webm',
      style: 'anime'
    }
  ]
}
```

### 5. Perplexity Integration Fix
Update Perplexity to include:
- Research phase (understand the keyword)
- Tool configuration context
- 9 FAQ questions
- Standardized section headings
- Proper JSON structure matching the template

## Implementation Tasks

### Phase 1: Core Fixes (Priority 1)
- [ ] Fix Perplexity integration in `seo/perplexity-research.mjs`
- [ ] Update FAQ template to 9 questions
- [ ] Add research phase to Perplexity
- [ ] Standardize section headings in both generators

### Phase 2: Configuration (Priority 2)
- [ ] Add examples strategy to `tool-configs/video-to-video/config.mjs`
- [ ] Add examples strategy to `tool-configs/playground/config.mjs`
- [ ] Add examples strategy to `tool-configs/image-animation-generator/config.mjs`
- [ ] Create page structure randomization utility

### Phase 3: Integration (Priority 3)
- [ ] Update `generate-variant-page.mjs` to use examples strategy
- [ ] Integrate page structure randomization
- [ ] Add output structure validation
- [ ] Create post-generation hooks for footer navigation
- [ ] Create post-generation hooks for i18n keys

### Phase 4: Documentation (Priority 4)
- [ ] Update README with new structure
- [ ] Document examples strategy configuration
- [ ] Add workflow diagrams
- [ ] Create troubleshooting guide

## Files to Modify

1. **scripts/variant-generation/seo/perplexity-research.mjs** - Fix integration
2. **scripts/variant-generation/core/streamlined-content-processor.mjs** - Standardize headings
3. **scripts/variant-generation/tool-configs/*/config.mjs** - Add examples strategy
4. **scripts/variant-generation/generate-variant-page.mjs** - Integrate new features
5. **scripts/variant-generation/README.md** - Update documentation

## Files to Create

1. **scripts/variant-generation/core/page-structure-randomizer.mjs** - Randomization utility
2. **scripts/variant-generation/core/post-generation-hooks.mjs** - Footer + i18n automation
3. **scripts/variant-generation/core/output-validator.mjs** - Structure validation

## Testing Plan

1. Generate a test variant for each tool type
2. Verify structure matches standard template
3. Verify FAQ has 9 questions
4. Verify section headings are standardized
5. Verify pageStructure is randomized
6. Verify examples are generated correctly
7. Test Perplexity integration
8. Test footer navigation addition
9. Test i18n key addition

## Success Criteria

- [ ] All variant types use the same standard structure
- [ ] Perplexity integration works properly
- [ ] FAQ always has 9 questions
- [ ] Section headings are SEO-friendly
- [ ] Content structure is randomized per page
- [ ] Examples generation is configurable per tool type
- [ ] Footer navigation is automatically updated
- [ ] i18n keys are automatically added
- [ ] Documentation is complete and clear

