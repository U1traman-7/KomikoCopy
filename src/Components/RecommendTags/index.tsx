import React, {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Chip } from '@nextui-org/react';
import { debounce } from 'lodash-es';
import cn from 'classnames';
import { default as getCaretCoordinates } from 'textarea-caret';

interface RecommendTagsProps {
  text: string;
  setText: (text: string | ((text: string) => string)) => void;
  inputElement: HTMLInputElement | HTMLTextAreaElement;
  className?: string;
  style?: React.CSSProperties;
  excludeKeywords?: string[];
}

interface Tag {
  tag: string;
  count: number;
}

const Tags = memo(
  ({
    tags,
    onClick,
    className,
    style = {},
    index = 0,
  }: {
    tags: Tag[];
    onClick?: (tag: string) => void;
    className?: string;
    style?: React.CSSProperties;
    index?: number;
  }) => {
    const pickTag = (tag: string) => {
      onClick?.(tag);
    };

    if (!tags.length) {
      return null;
    }

    return (
      <ul
        className={cn(
          'fixed rounded-md border bg-card shadow-sm border-primary max-w-[400px] max-h-[240px] overflow-y-auto',
          className,
        )}
        style={style}>
        {tags.map((tag, i) => (
          <li
            key={tag.tag}
            className={cn(
              'cursor-pointer px-3 py-2 hover:bg-primary/10 space-y-2',
              {
                'bg-primary/10': i === index,
              },
            )}>
            <div
              className='flex justify-between items-center w-full'
              role='button'
              tabIndex={0}
              aria-label={tag.tag}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  pickTag(tag.tag);
                }
              }}
              onClick={() => {
                pickTag(tag.tag);
              }}>
              <div className='flex gap-2 items-center'>
                <span className='text-sm'>{tag.tag}</span>
                <Chip
                  size='sm'
                  color='primary'
                  className='text-center font-medium px-2 py-0.5 text-xs h-5'>
                  {tag.count}
                </Chip>
              </div>
              {i === index && (
                <div className='rounded bg-muted ml-2 px-2 py-0.5 text-xs font-medium'>
                  TAB
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  },
);

const trailKeywordReg = /,\s*([^,]+?)$/;

// 转义正则表达式特殊字符
const escapeRegExp = (string: string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const RecommendTags: React.FC<RecommendTagsProps> = ({
  text,
  setText,
  inputElement,
  className,
  style,
  excludeKeywords,
}) => {
  const [debouncedText, setDebouncedText] = useState(text);
  const originTags = useRef<Tag[]>([]);
  const tagsRef = useRef<Tag[]>([]);
  const [hidden, setHidden] = useState(false);
  const [caret, setCaret] = useState({
    left: 0,
    top: 0,
  });
  const onPickingIndexRef = useRef(0);
  const [onPickingIndex, setOnPickingIndex] = useState(0);
  const screenSizeRef = useRef({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    screenSizeRef.current = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  const pickTag = useCallback((tag: string) => {
    setText(text => {
      if (trailKeywordReg.test(text)) {
        return text.replace(trailKeywordReg, `, ${tag}, `);
      }
      return `${tag}, `;
    });
  }, []);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedText(text);
    }, 50);
    handler();
    return () => {
      handler.cancel();
    };
  }, [text]);

  useEffect(() => {
    import('./danbooru-tags.json').then(res => {
      originTags.current = (res.default as Tag[]).filter(tag => tag.tag);
    });
  }, []);

  const tags = useMemo(() => {
    if (!debouncedText || !originTags.current.length) {
      return [];
    }

    if (debouncedText?.length < 2) {
      return [];
    }

    if (!trailKeywordReg.test(debouncedText)) {
      try {
        const reg = new RegExp(escapeRegExp(debouncedText), 'i');
        return originTags.current.filter((tag: Tag) => reg.test(tag.tag));
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    const keyword = debouncedText.trim().match(trailKeywordReg)?.[1];
    if (!keyword) {
      return [];
    }
    if (keyword.length < 2) {
      return [];
    }

    if (excludeKeywords?.includes(keyword)) {
      return [];
    }

    try {
      const reg = new RegExp(escapeRegExp(keyword), 'i');
      return originTags.current.filter(tag => reg.test(tag.tag));
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [debouncedText]);

  useEffect(() => {
    tagsRef.current = tags || [];
  }, [tags]);

  useEffect(() => {
    setOnPickingIndex(0);
  }, [hidden, tags]);

  useEffect(() => {
    onPickingIndexRef.current = onPickingIndex;
  }, [onPickingIndex]);

  useEffect(() => {
    if (!inputElement) {
      return;
    }

    const tags = tagsRef.current;

    const handleKeyDown = debounce((e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (tags?.length) {
          pickTag(tags[onPickingIndexRef.current].tag);
          inputElement?.focus();
        }
      }
      if (
        (e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
        tags?.length &&
        !hidden
      ) {
        e.preventDefault();
      }
    }, 50);

    const handleInput = debounce((e: Event) => {
      if (!inputElement) {
        return;
      }
      const isFocused = inputElement === document.activeElement;
      if (!isFocused) {
        return; // 如果没被 focus，不处理
      }

      e.preventDefault();
      const caret = getCaretCoordinates(
        inputElement,
        inputElement.selectionEnd || 0,
      );

      // 获取 textarea 相对于视口的位置
      const inputRect = inputElement.getBoundingClientRect();

      // 计算初始位置（相对于视口）
      let left = inputRect.left + caret.left;
      let top = inputRect.top + caret.top + caret.height + 10;

      // 获取屏幕尺寸
      const screenWidth = screenSizeRef.current.width;
      const screenHeight = screenSizeRef.current.height;

      // Tags列表的最大宽度（从CSS中获取）
      const tagsMaxWidth = 360; // max-w-[360px]

      // 检查右边界是否超出屏幕
      if (left + tagsMaxWidth > screenWidth) {
        left = Math.max(0, screenWidth - tagsMaxWidth - 10); // 留10px边距
      }

      // 检查左边界是否超出屏幕
      if (left < 0) {
        left = 10; // 留10px边距
      }

      // 检查下边界是否超出屏幕
      const estimatedTagsHeight = Math.min(tags.length * 50, 200); // 估算Tags列表高度
      if (top + estimatedTagsHeight > screenHeight) {
        // 如果下方空间不够，显示在光标上方
        top = Math.max(10, caret.top - estimatedTagsHeight - 10);
      }

      // 确保top不会超出屏幕顶部
      if (top < 10) {
        top = 10;
      }

      setCaret({
        left,
        top,
      });
      setHidden(false);
    }, 50);

    const handleFocus = () => {
      setHidden(false);
    };

    // 窗口大小变化时重新计算位置
    const handleResize = debounce(() => {
      screenSizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      if (!hidden && inputElement) {
        // 触发重新计算位置
        const event = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(event);
      }
    }, 100);

    const handleClick = (e: MouseEvent) => {
      if (e.target !== inputElement) {
        setHidden(true);
      }
    };

    const handleArrowKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && tags?.length && !hidden) {
        e.preventDefault();
        setOnPickingIndex(prev => (prev + 1) % tags.length);
      }
      if (e.key === 'ArrowUp' && tags?.length && !hidden) {
        e.preventDefault();
        setOnPickingIndex(prev => (prev - 1 + tags.length) % tags.length);
      }
    };
    window.addEventListener(
      'keydown',
      handleArrowKeydown as unknown as EventListener,
    );

    inputElement.addEventListener(
      'keydown',
      handleKeyDown as unknown as EventListener,
    );
    inputElement.addEventListener('focus', handleFocus);
    inputElement.addEventListener('input', handleInput);
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClick);

    return () => {
      inputElement?.removeEventListener(
        'keydown',
        handleKeyDown as unknown as EventListener,
      );
      inputElement?.removeEventListener('focus', handleFocus);
      inputElement?.removeEventListener('input', handleInput);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClick);
      window.removeEventListener(
        'keydown',
        handleArrowKeydown as unknown as EventListener,
      );
    };
  }, [inputElement, pickTag, tags, hidden]);

  return (
    <Tags
      tags={tags}
      index={onPickingIndex}
      onClick={tag => {
        pickTag(tag);
        inputElement?.focus();
      }}
      className={cn(className, { hidden })}
      style={{
        ...style,
        ...caret,
      }}
    />
  );
};
export default memo(RecommendTags);
