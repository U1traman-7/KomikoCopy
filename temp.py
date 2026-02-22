# Note: DALL-E 3 requires version 1.0.0 of the openai-python library or later
import os
from openai import AzureOpenAI
import json

client = AzureOpenAI(
    api_version="2024-02-01",
    azure_endpoint="https://dalleinstant.openai.azure.com/",
    api_key="fd39e7eb793a497ca9b1e4bd66138fca",
)

result = client.images.generate(
    model="Dalle", # the name of your DALL-E 3 deployment
    prompt="girl",
    n=1
)

image_url = json.loads(result.model_dump_json())['data'][0]['url']
print(image_url)