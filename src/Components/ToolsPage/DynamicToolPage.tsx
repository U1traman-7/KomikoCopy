import React from 'react';
import Image from 'next/image';
import { Button } from '@nextui-org/react';
import ToolsHeader from './ToolsHeader';

interface Example {
  title: string;
  image: string;
  prompt: string;
}

interface ToolData {
  title: string;
  description: string;
  examples: Example[];
  features: string[];
  category: string;
  isVariant: boolean;
  baseKey: string;
  variantKey?: string;
}

interface DynamicToolPageProps {
  toolData: ToolData;
  slug: string[];
  toolName?: string;
  variantName?: string;
}

const DynamicToolPage: React.FC<DynamicToolPageProps> = ({
  toolData,
  slug,
  toolName,
  variantName
}) => {
  const handleGenerate = () => {
    // 根据工具类型调用对应的生成逻辑
    console.log('Generate with tool:', toolName, variantName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-background dark:to-muted">
      <ToolsHeader />

      <div className="container mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {toolData.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {toolData.description}
          </p>
        </div>

        {/* 功能特点 */}
        {toolData.features && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {toolData.features.map((feature, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-lg text-center">
                <h3 className="font-semibold text-lg mb-2">{feature}</h3>
              </div>
            ))}
          </div>
        )}

        {/* 示例图片展示 */}
        {toolData.examples && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Examples</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {toolData.examples.map((example, index) => (
                <div key={index} className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <div className="relative h-64">
                    <Image
                      src={example.image}
                      alt={example.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{example.title}</h3>
                    <p className="text-muted-foreground text-sm">{example.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-primary-foreground font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all"
            onClick={handleGenerate}
          >
            Generate Now
          </Button>
        </div>

        {/* 相关工具推荐 */}
        {toolData.isVariant && (
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-6">More {toolData.baseKey} Variants</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button variant="bordered" className="rounded-full">
                Base Generator
              </Button>
              <Button variant="bordered" className="rounded-full">
                Other Variants
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicToolPage; 