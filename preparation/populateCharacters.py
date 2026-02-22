"""
改造后的角色图片生成脚本
使用 Kusa API (与 generateImageArtPro.ts 相同的接口) 生成 9:16 比例的角色图片

使用前需要设置环境变量:
export KUSA_API_KEY="your_kusa_api_key"

改动说明:
1. 替换为 Kusa API 接口 (https://api.kusa.pics/api/go/b2b/tasks/create)
2. 使用异步任务模式：创建任务 -> 轮询状态 -> 获取结果
3. 图片尺寸改为 768x1152 (9:16 比例)
4. 使用与 TypeScript 版本相同的 prompt 和 negative_prompt
5. 添加轮询机制，最多等待5分钟
"""

import os
import requests
from PIL import Image
from io import BytesIO
import json
import time

from tqdm import tqdm

characters = json.load(open("src/assets/characters.json"))
for world in tqdm(characters):
    world_name = world["world"].replace("/", "-").replace(":", "_")
    world_characters = world["characters"]
    os.makedirs(f"public/images/characters/{world_name}", exist_ok=True)
    for character in tqdm(world_characters):
        character = character["name"]
        # Sanitize character name for filename (replace invalid characters)
        safe_character_name = character.replace("/", "-").replace(":", "_")
        character_path_jpg = f"public/images/characters/{world_name}/{safe_character_name}.jpg"
        character_path_small_webp = f"public/images/characters/{world_name}/{safe_character_name}.webp"
        character_path_normal_webp = f"public/images/characters/{world_name}/{safe_character_name}_normal.webp"
        # if os.path.exists(character_path_webp):
        #     print("skip")
        #     continue
        if os.path.exists(character_path_jpg):
            print("skip")
            image = Image.open(character_path_jpg)
        else:
            # 使用 Kusa API 生成图片
            # 第一步：创建任务
            create_url = 'https://api.kusa.pics/api/go/b2b/tasks/create'
            create_data = {
                'task_type': 'TEXT_TO_IMAGE',
                'params': {
                    'prompt': f'{character}, solo, full body, standing, looking at viewer, white background, best quality, 4k, masterpiece, highres, amazing quality',
                    'style_id': '70',  # 默认样式ID
                    'width': 1080,     # 9:16 比例
                    'height': 1440,   # 9:16 比例
                    'negative_prompt': '(nsfw:1.4),sexy,sex,nipples, pussy, chibi',
                    'amount': 1,
                }
            }
            create_headers = {
                'Content-Type': 'application/json',
                'X-API-Key': os.getenv('KUSA_API_KEY', '')  # 需要设置环境变量
            }
            
            # 创建任务
            create_response = requests.post(create_url, json=create_data, headers=create_headers)
            if not create_response.ok:
                print(f"Failed to create task for {character}: {create_response.status_code}")
                continue
                
            create_result = create_response.json()
            if create_result.get('code'):
                print(f"API error for {character}: {create_result.get('message')}")
                continue
                
            task_id = create_result['data']['task_id']
            print(f"Created task {task_id} for {character}")
            
            # 第二步：轮询任务结果
            get_url = 'https://api.kusa.pics/api/go/b2b/tasks/get'
            get_headers = {
                'Content-Type': 'application/json',
                'X-API-Key': os.getenv('KUSA_API_KEY', '')
            }
            
            # 轮询直到完成
            max_attempts = 60  # 最多等待5分钟
            attempt = 0
            image_url = None
            
            while attempt < max_attempts:
                time.sleep(5)  # 等待5秒
                attempt += 1
                
                get_data = {'task_id': task_id}
                get_response = requests.post(get_url, json=get_data, headers=get_headers)
                
                if not get_response.ok:
                    print(f"Failed to check task status: {get_response.status_code}")
                    continue
                    
                result = get_response.json()
                if result.get('code'):
                    print(f"API error checking status: {result.get('message')}")
                    break
                    
                status = result['data']['status']
                print(f"Task {task_id} status: {status} (attempt {attempt})")
                
                if status == 'COMPLETED':
                    image_url = result['data']['result']['images'][0]['display_url']
                    break
                elif status == 'FAILED':
                    error_msg = result['data'].get('error_message', 'Unknown error')
                    print(f"Task failed: {error_msg}")
                    break
            
            if not image_url:
                print(f"Failed to generate image for {character}")
                continue
            
            # 下载并保存图片
            try:
                image_response = requests.get(image_url)
                if image_response.ok:
                    image = Image.open(BytesIO(image_response.content))
                    image.save(character_path_jpg, format='JPEG')
                    print(f"Saved image for {character} to {character_path_jpg}")
                else:
                    print(f"Failed to download image for {character}")
                    continue
            except Exception as e:
                print(f"Error saving image for {character}: {e}")
                continue

        # 调整图片大小并转换为WebP格式
        image.save(character_path_normal_webp, format='WEBP')
        image = image.resize((180, 240))
        try:
            image.save(character_path_small_webp, format='WEBP')
        except Exception as e:
            print("error", e)
            continue