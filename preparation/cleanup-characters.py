#!/usr/bin/env python3
import json
import os
from pathlib import Path

# 配置文件路径
CHARACTERS_JSON_PATH = Path(__file__).parent.parent / "src" / "assets" / "characters.json"
IMAGES_BASE_PATH = Path(__file__).parent.parent / "public" / "images" / "characters"

def check_image_exists(world: str, character_name: str) -> bool:
    """
    检查图片文件是否存在
    
    Args:
        world: 世界名称
        character_name: 角色名称
        
    Returns:
        bool: 图片是否存在
    """
    image_dir = IMAGES_BASE_PATH / world.replace("/", "-").replace(":", "_")
    
    # 检查目录是否存在
    if not image_dir.exists():
        return False
    
    # 检查可能的图片文件扩展名
    extensions = ['.jpg', '.jpeg', '.png', '.webp']
    safe_character_name = character_name.replace("/", "-").replace(":", "_")

    for ext in extensions:
        image_path = image_dir / f"{safe_character_name}{ext}"
        if image_path.exists():
            return True
    
    return False

def cleanup_characters():
    """清理不存在的角色条目"""
    try:
        print("开始清理角色数据...")
        
        # 读取characters.json文件
        with open(CHARACTERS_JSON_PATH, 'r', encoding='utf-8') as f:
            characters_data = json.load(f)
        
        total_characters = 0
        removed_characters = 0
        removed_worlds = 0
        
        # 遍历每个世界
        cleaned_data = []
        for world in characters_data:
            print(f"\n检查世界: {world['world']}")
            
            # 过滤掉不存在的角色
            valid_characters = []
            for character in world['characters']:
                total_characters += 1
                
                exists = check_image_exists(world['world'], character['name'])
                
                if not exists:
                    print(f"  ❌ 删除角色: {character['name']} (图片不存在)")
                    removed_characters += 1
                else:
                    # print(f"  ✅ 保留角色: {character['name']}")
                    valid_characters.append(character)
            
            # 如果世界下没有角色了，跳过这个世界
            if len(valid_characters) == 0:
                print(f"  🗑️  删除空世界: {world['world']}")
                removed_worlds += 1
            else:
                # 更新世界的角色列表
                world['characters'] = valid_characters
                cleaned_data.append(world)
        
        # 保存清理后的数据
        with open(CHARACTERS_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
        
        # 输出统计信息
        print("\n=== 清理完成 ===")
        print(f"总角色数: {total_characters}")
        print(f"删除角色数: {removed_characters}")
        print(f"删除世界数: {removed_worlds}")
        print(f"剩余世界数: {len(cleaned_data)}")
        print(f"剩余角色数: {total_characters - removed_characters}")
        
        # 显示剩余的世界
        print("\n剩余的世界:")
        for world in cleaned_data:
            print(f"  - {world['world']}: {len(world['characters'])} 个角色")
        
    except Exception as error:
        print(f"清理过程中发生错误: {error}")
        exit(1)

if __name__ == "__main__":
    cleanup_characters()
