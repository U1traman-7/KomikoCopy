#!/bin/bash

echo "🔄 恢复 variants 文件"
echo ""

# 查找最新的备份目录
BACKUP_DIR=$(ls -dt ../variants-backup-* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
  echo "❌ 没有找到备份目录"
  exit 1
fi

echo "📁 从备份目录恢复: $BACKUP_DIR"
echo ""

# 恢复 variants 文件
for locale_backup in "$BACKUP_DIR"/*/; do
  if [ -d "$locale_backup" ]; then
    locale=$(basename "$locale_backup")
    if [ -d "${locale_backup}variants" ]; then
      echo "  - 恢复 ${locale}/variants"
      mkdir -p "src/i18n/locales/$locale"
      cp -r "${locale_backup}variants" "src/i18n/locales/$locale/" 2>/dev/null || true
    fi
  fi
done

echo ""
echo "✅ 完成！variants 文件已恢复"
echo ""
echo "💡 提示:"
echo "   - 备份目录仍然保留在: $BACKUP_DIR"
echo "   - 如果需要，可以手动删除备份目录"

