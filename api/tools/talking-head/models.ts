import { getAuthUserId } from "../image-generation.js";
import { failed } from "../../_utils/index.js";

const BASE_URL = "https://api.hedra.com/web-app";

// Cache for Hedra models with expiration
let modelsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache TTL

// Default fallback data if API fails
const DEFAULT_MODELS = [
  {
      "id": "d1dd37a3-e39a-4854-a298-6510289f9cf2",
      "name": "Hedra Character 3",
      "description": "",
      "type": "video",
      "aspect_ratios": [
          "1:1",
          "16:9",
          "9:16"
      ],
      "resolutions": [
          "540p",
          "720p"
      ],
      "durations": [
          "auto"
      ],
      "requires_start_frame": true,
      "requires_audio_input": true,
      "custom_resolution": null,
      "price_details": {
          "credit_cost": 360,
          "unit_scale": 1,
          "billing_unit": "minute"
      },
      "dimensions": null
  }
]

// Function to fetch models from API
async function fetchModelsFromAPI() {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing API key");
    throw new Error("Server configuration error");
  }

  console.log("🔍 Getting available models from Hedra API");
  const modelsResponse = await fetch(`${BASE_URL}/public/models`, {
    headers: {
      'x-api-key': apiKey,
    }
  });

  if (!modelsResponse.ok) {
    const errorText = await modelsResponse.text();
    console.error(`❌ Failed to get models: ${modelsResponse.status}, ${errorText}`);
    throw new Error(`Failed to get available models: ${modelsResponse.status}`);
  }

  const modelsData = await modelsResponse.json();
  console.log(`✅ Successfully fetched ${modelsData.length} models`);
  return modelsData;
}

// Function to update cache in background
async function updateCacheInBackground() {
  try {
    const freshData = await fetchModelsFromAPI();
    modelsCache = freshData;
    cacheTimestamp = Date.now();
    console.log("🔄 Background cache update completed");
  } catch (error) {
    console.error("❌ Background cache update failed:", error);
    // Keep using old cache if update fails
  }
}

export async function GET(request: Request) {
  try {
    console.log("🚀 Processing models request");
    
    // Check if cache is valid
    const isCacheValid = modelsCache && (Date.now() - cacheTimestamp < CACHE_TTL);
    
    // Return cached data immediately if available
    if (isCacheValid) {
      console.log("📦 Returning cached models data");
      // Trigger background refresh if cache is getting old (over 50% of TTL)
      if (Date.now() - cacheTimestamp > CACHE_TTL / 2) {
        console.log("🔄 Cache is aging, triggering background refresh");
        updateCacheInBackground().catch(console.error);
      }
      return new Response(JSON.stringify(modelsCache), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // No valid cache, try to fetch fresh data
    try {
      console.log("🔍 No valid cache, fetching fresh data");
      const freshData = await fetchModelsFromAPI();
      modelsCache = freshData;
      cacheTimestamp = Date.now();
      
      return new Response(JSON.stringify(freshData), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("❌ Failed to fetch fresh data:", error);
      
      // If we have stale cache, use it as fallback
      if (modelsCache) {
        console.log("⚠️ Using stale cache as fallback");
        return new Response(JSON.stringify(modelsCache), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // No cache at all, return default data
      console.log("⚠️ No cache available, using default models data");
      return new Response(JSON.stringify(DEFAULT_MODELS), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error in models endpoint:', error);
    const errorMessage = error.message || "Failed to process models request";
    console.log(`❌ Process failed with error: ${errorMessage}`);
    return failed(errorMessage);
  }
} 