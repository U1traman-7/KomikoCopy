#!/bin/bash

echo "🚀 临时禁用 variants 文件以修复 EBADF 错误"
echo ""

# 创建备份目录
BACKUP_DIR="../variants-backup-$(date +%Y%m%d-%H%M%S)"
echo "📁 创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 移动 variants 文件
echo "📦 移动 variants 文件到备份目录..."
for locale_dir in src/i18n/locales/*/; do
  if [ -d "${locale_dir}variants" ]; then
    locale=$(basename "$locale_dir")
    echo "  - 移动 ${locale}/variants"
    mkdir -p "$BACKUP_DIR/$locale"
    mv "${locale_dir}variants" "$BACKUP_DIR/$locale/" 2>/dev/null || true
  fi
done

echo ""
echo "✅ 完成！variants 文件已移动到: $BACKUP_DIR"
echo ""
echo "⚠️  注意:"
echo "   - 所有 variant 页面将暂时不可用"
echo "   - 只有主工具页面可以访问"
echo "   - 这是临时解决方案，用于快速启动开发服务器"
echo ""
echo "🔄 恢复 variants:"
echo "   ./temp-restore-variants.sh"
echo ""
echo "🚀 现在可以启动开发服务器:"
echo "   vc dev"

