# Variant Page Generation - Complete Usage Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Standard Output Structure](#standard-output-structure)
4. [Generation Modes](#generation-modes)
5. [Examples Strategy](#examples-strategy)
6. [Page Structure Randomization](#page-structure-randomization)
7. [FAQ Structure](#faq-structure)
8. [Tool Configuration](#tool-configuration)
9. [Troubleshooting](#troubleshooting)

## Overview

The variant page generation system creates SEO-optimized derivative pages for AI tools. Version 2.0 introduces:

- **Standardized Structure**: All variant types use the same consistent format
- **Content Randomization**: Automatic page structure shuffling to avoid content farm detection
- **Perplexity Integration**: Research-based content generation with online search
- **Examples Strategy**: Configurable examples generation per tool type
- **9 FAQ Questions**: Comprehensive FAQ section with standardized questions

## Quick Start

### 1. Setup Configuration

```bash
cd scripts/variant-generation
node generate-variant-page.mjs setup
```

Configure:
- API Base URL (default: `http://localhost:3000`)
- Session Token (required for API calls)
- Default Model (default: `Animagine`)
- Images Per Variant (default: 6)
- Perplexity API Key (optional, for research-based generation)

### 2. Generate a Variant Page

```bash
# Using streamlined mode (default)
node generate-variant-page.mjs video-to-video "Anime Video Converter"

# Using Perplexity mode (with research)
node generate-variant-page.mjs video-to-video "Anime Video Converter" --mode=perplexity

# Text only (no images)
node generate-variant-page.mjs playground "Naruto AI Filter" --text-only

# Images only (use existing content)
node generate-variant-page.mjs playground "Naruto AI Filter" --images-only
```

## Standard Output Structure

All variant pages follow this structure:

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
      ]
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

## Generation Modes

### Streamlined Mode (Default)
Uses internal AI to generate content based on original tool content.

```bash
node generate-variant-page.mjs video-to-video "Anime Video Converter"
# or explicitly
node generate-variant-page.mjs video-to-video "Anime Video Converter" --mode=streamlined
```

**Pros:**
- Fast generation
- Consistent quality
- No external API dependencies

**Cons:**
- Limited research capabilities
- May not capture competitor-specific features

### Perplexity Mode
Uses Perplexity AI to research the keyword and generate content.

```bash
node generate-variant-page.mjs video-to-video "Anime Video Converter" --mode=perplexity
```

**Pros:**
- Research-based content
- Better understanding of competitor tools
- Higher keyword density
- More accurate positioning

**Cons:**
- Requires Perplexity API key
- Slower generation
- API costs

## Examples Strategy

Each tool type has a configurable examples generation strategy defined in `tool-configs/{toolType}/config.mjs`.

### Playground (api-batch)
Generates examples by calling the API with preset input images and styles.

```javascript
export const examplesStrategy = {
  type: 'api-batch',
  count: 4,
  inputImages: [
    '/images/examples/photo-to-anime/input1.jpg',
    '/images/examples/photo-to-anime/input2.jpg',
    '/images/examples/photo-to-anime/input3.jpg',
    '/images/examples/photo-to-anime/input4.jpg'
  ]
}
```

### Video-to-Video (comparison-videos)
Selects from a pool of comparison video pairs.

```javascript
export const examplesStrategy = {
  type: 'comparison-videos',
  count: 4,
  comparisonPairs: [
    {
      input: '/images/examples/video-to-video/input1.webm',
      output: '/images/examples/video-to-video/output1.webm',
      styles: ['anime', 'anime-style']
    }
  ]
}
```

### Image Animation Generator (video-pool)
Randomly selects from a pool of video examples.

```javascript
export const examplesStrategy = {
  type: 'video-pool',
  count: 6,
  videoPool: [...] // From toolConfig.examples
}
```

## Page Structure Randomization

To avoid content farm detection, the page structure is randomized for each variant while maintaining SEO best practices.

### Rules
1. `whatIs` and `examples` must be in the first 2 positions
2. `moreAITools` and `cta` always at the end
3. Remaining sections (`howToUse`, `whyUse`, `faq`) are shuffled

### Example Structures

**Original:**
```
["whatIs", "examples", "howToUse", "whyUse", "moreAITools", "faq", "cta"]
```

**Randomized:**
```
["examples", "whatIs", "faq", "howToUse", "whyUse", "moreAITools", "cta"]
["whatIs", "examples", "whyUse", "faq", "howToUse", "moreAITools", "cta"]
["examples", "whatIs", "howToUse", "faq", "whyUse", "moreAITools", "cta"]
```

## FAQ Structure

All variants must include exactly 9 FAQ questions following this pattern:

1. **What is XXX?** - Tool definition and explanation
2. **How to XXX?** - Usage steps and process
3. **How does XXX work?** - Technical explanation
4. **What is the best XXX?** - KomikoAI positioning
5. **Is the KomikoAI XXX free online?** - Free tier information
6. **What can I do with XXX?** - Use cases and possibilities
7. **Can I use XXX on my phone?** - Device compatibility
8. **Can I download my generation from XXX?** - Export formats
9. **Why should I use XXX?** - Benefits summary

**Note:** "XXX" should be a grammatically correct theme-related term, not just the tool name.

## Tool Configuration

Each tool type has a configuration file at `tool-configs/{toolType}/config.mjs` that defines:

- Tool description and features
- Target audience
- Use cases
- Technical specifications
- Examples generation strategy

This configuration is used by both Streamlined and Perplexity modes to ensure accurate content generation.

## Troubleshooting

### Perplexity API Errors
- Ensure your API key is configured: `node generate-variant-page.mjs setup`
- Check API quota and rate limits
- System will automatically fall back to Streamlined mode if Perplexity fails

### JSON Parsing Errors
- Check debug files: `debug-json-error-*.json`
- Verify AI response format
- Try regenerating with `--force` flag

### Missing Examples
- For playground: Ensure API is running and session token is valid
- For video-to-video: Check that video files exist in the specified paths
- For image-animation: Verify video pool in tool config

### Page Structure Issues
- Validate structure with `PageStructureRandomizer.validatePageStructure()`
- Check that required sections are present
- Ensure `cta` is last and `moreAITools` is second to last

