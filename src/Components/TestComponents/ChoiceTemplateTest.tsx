import React, { useState } from 'react';
import { Input, Textarea } from '@nextui-org/react';
import {
  mockChoiceTemplateData,
  exampleUsage,
  testVariableReplacement,
} from '../../utils/mockChoiceTemplateData';
import { TemplateInputField } from '../StyleTemplatePicker/styles';

// 选择题模板功能测试组件
export const ChoiceTemplateTest: React.FC = () => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const template = mockChoiceTemplateData;
  const inputFields = template.character_inputs || [];

  // 计算当前的prompt预览
  const generatePromptPreview = () => {
    const basePrompt = template.prompt.prompt;
    return testVariableReplacement(basePrompt, inputValues);
  };

  const handleValueChange = (fieldName: string, value: string) => {
    setInputValues(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <div className='bg-card rounded-lg shadow-lg p-6'>
        <h2 className='text-2xl font-bold mb-6 text-heading'>
          选择题模板功能测试
        </h2>

        {/* 模板信息 */}
        <div className='mb-6 p-4 bg-muted rounded-lg'>
          <h3 className='font-semibold text-foreground mb-2'>模板信息</h3>
          <p>
            <strong>ID:</strong> {template.id}
          </p>
          <p>
            <strong>名称:</strong> {template.name_key}
          </p>
          <p>
            <strong>原始Prompt:</strong>{' '}
            <code className='text-sm bg-muted px-2 py-1 rounded'>
              {template.prompt.prompt}
            </code>
          </p>
        </div>

        {/* 输入字段渲染 */}
        <div className='space-y-4 mb-6'>
          <h3 className='font-semibold text-foreground mb-3'>配置字段</h3>

          {inputFields.map(inputField => {
            const fieldName = inputField.input_field;
            const fieldType = inputField.type || 'text';
            const placeholder =
              inputField.placeholder || `Enter ${fieldName}...`;
            const label =
              fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

            const handleFieldValueChange = (value: string) => {
              handleValueChange(fieldName, value);
            };

            // 选择题渲染
            if (fieldType === 'choice' && inputField.choices) {
              return (
                <div key={fieldName} className='space-y-3'>
                  {inputField.question && (
                    <div className='p-4 bg-blue-50 rounded-lg'>
                      <p className='font-medium text-foreground mb-3'>
                        {inputField.question}
                      </p>
                      <div className='space-y-2'>
                        {inputField.choices.map(choice => (
                          <label
                            key={choice.value}
                            className='flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-blue-100 hover:border-blue-400 group'
                            style={{
                              borderColor:
                                inputValues[fieldName] === choice.value
                                  ? '#3b82f6'
                                  : '#e5e7eb',
                              backgroundColor:
                                inputValues[fieldName] === choice.value
                                  ? '#dbeafe'
                                  : 'white',
                            }}>
                            <input
                              type='radio'
                              name={fieldName}
                              value={choice.value}
                              checked={inputValues[fieldName] === choice.value}
                              onChange={e =>
                                handleFieldValueChange(e.target.value)
                              }
                              className='mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500'
                            />
                            <div className='flex-1'>
                              <span className='text-sm font-medium text-foreground'>
                                {choice.label}
                              </span>
                              <p className='text-xs text-muted-foreground mt-1'>
                                值: "{choice.value}"
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // 文本输入渲染
            const isTextarea = fieldType === 'textarea';

            return (
              <div key={fieldName}>
                {isTextarea ? (
                  <Textarea
                    label={label}
                    placeholder={placeholder as string}
                    value={inputValues[fieldName] || ''}
                    onValueChange={handleFieldValueChange}
                    variant='flat'
                    size='sm'
                    minRows={3}
                  />
                ) : (
                  <Input
                    label={label}
                    placeholder={placeholder as string}
                    value={inputValues[fieldName] || ''}
                    onValueChange={handleFieldValueChange}
                    variant='flat'
                    size='sm'
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Prompt 预览 */}
        <div className='p-4 bg-green-50 rounded-lg'>
          <h3 className='font-semibold text-foreground mb-2'>Prompt 预览</h3>
          <p className='text-sm text-foreground bg-card p-3 rounded border font-mono'>
            {generatePromptPreview()}
          </p>
        </div>

        {/* 当前输入值显示 */}
        <div className='mt-4 p-4 bg-yellow-50 rounded-lg'>
          <h3 className='font-semibold text-foreground mb-2'>当前输入值</h3>
          <pre className='text-sm text-foreground bg-card p-3 rounded border'>
            {JSON.stringify(inputValues, null, 2)}
          </pre>
        </div>

        {/* 预期示例 */}
        <div className='mt-4 p-4 bg-purple-50 rounded-lg'>
          <h3 className='font-semibold text-foreground mb-2'>
            示例输入与预期结果
          </h3>
          <div className='text-sm'>
            <p>
              <strong>示例输入:</strong>
            </p>
            <pre className='bg-card p-2 rounded border mb-2'>
              {JSON.stringify(exampleUsage.userInputs, null, 2)}
            </pre>
            <p>
              <strong>预期结果:</strong>
            </p>
            <p className='bg-card p-2 rounded border font-mono'>
              {exampleUsage.expectedPrompt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoiceTemplateTest;
