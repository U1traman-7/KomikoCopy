import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from '@nextui-org/react';
import { IoIosArrowDown } from 'react-icons/io';
import cn from 'classnames';

export interface SelectItemProps {
  itemKey: string | number;
  value: string | number;
  textValue?: string;
  children?: React.ReactNode;
}

interface SelectProps {
  placeholder?: string;
  defaultSelectedKeys?: (string | number)[];
  selectedKeys?: (string | number)[]; // controlled mode
  className?: string;
  onSelectionChange?: (keys: Set<string | number>) => void;
  classNames?: {
    trigger?: string;
    listboxWrapper?: string;
  };
  'aria-label'?: string;
  children: React.ReactNode;
  renderValue?: (items: SelectItemProps[]) => React.ReactNode;
  disabledKeys?: Array<string | number>;
}

export const SelectItem: React.FC<SelectItemProps> = memo(({ children }) => (
  <>{children}</>
));

const Select: React.FC<SelectProps> = memo(
  ({
    placeholder,
    defaultSelectedKeys = [],
    selectedKeys: controlledSelectedKeys,
    onSelectionChange,
    classNames,
    children,
    renderValue,
    disabledKeys,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(
      new Set(defaultSelectedKeys),
    );
    // Controlled or uncontrolled selected keys
    const isControlled = controlledSelectedKeys !== undefined;
    const displayedSelectedKeys = useMemo(
      () => (isControlled ? new Set(controlledSelectedKeys) : selectedKeys),
      [isControlled, controlledSelectedKeys, selectedKeys],
    );
    const normalizedSelectedKeys = useMemo(
      () => new Set(Array.from(displayedSelectedKeys).map(k => String(k))),
      [displayedSelectedKeys],
    );
    const [triggerWidth, setTriggerWidth] = useState<number>(0);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      setSelectedKeys(new Set(defaultSelectedKeys));
    }, [JSON.stringify(defaultSelectedKeys)]);
    const handleOpenChange = (open: boolean) => {
      if (open && triggerRef.current) {
        const width = triggerRef.current.clientWidth;
        setTriggerWidth(width);
      }
      setIsOpen(open);
    };

    const items = useMemo(() => {
      const itemArray: SelectItemProps[] = [];
      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          itemArray.push({
            itemKey: child.key as string | number,
            value: child.props.value,
            textValue: child.props.textValue,
            children: child.props.children,
          });
        }
      });
      return itemArray;
    }, [children]);

    const selectedItem = useMemo(() => {
      const selectedKey = Array.from(normalizedSelectedKeys)[0];
      return items.find(item => String(item.itemKey) === String(selectedKey));
    }, [normalizedSelectedKeys, items]);

    const handleSelectionChange = useCallback(
      (key: string | number) => {
        const newSelection = new Set([key]);
        if (!isControlled) {
          setSelectedKeys(newSelection);
        }
        onSelectionChange?.(newSelection);
        setIsOpen(false);
      },
      [onSelectionChange, isControlled],
    );

    const renderTriggerContent = () => {
      if (renderValue && selectedItem) {
        return renderValue([selectedItem]);
      }

      return (
        <span className={!selectedItem ? 'text-muted-foreground' : ''}>
          {selectedItem?.textValue || placeholder}
        </span>
      );
    };

    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        placement='bottom'
        showArrow={false}>
        <PopoverTrigger>
          <Button
            ref={triggerRef}
            className={cn(
              'w-full h-[40px] px-3 justify-between',
              'text-left rounded-lg bg-default-100',
              'data-[hover=true]:bg-default-200',
              classNames?.trigger,
            )}>
            <div className='flex items-center justify-between w-full'>
              {renderTriggerContent()}
              <IoIosArrowDown
                className={cn(
                  'text-muted-foreground transition-transform duration-200',
                  isOpen ? 'rotate-180' : 'rotate-0',
                )}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-0 bg-card'>
          <div
            className={cn(
              'max-h-[300px] overflow-y-auto py-2 box-border',
              classNames?.listboxWrapper,
            )}
            style={{ width: triggerWidth ? `${triggerWidth}px` : 'auto' }}>
            {items.map(item => {
              const isDisabled = !!disabledKeys?.some(k => k === item.itemKey);
              return (
                <div
                  key={item.itemKey}
                  className='px-2 cursor-pointer'
                  onClick={() => {
                    if (!isDisabled) {
                      handleSelectionChange(item.itemKey);
                    }
                  }}>
                  <Button
                    isDisabled={isDisabled}
                    onPress={() => {
                      if (!isDisabled) {
                        handleSelectionChange(item.itemKey);
                      }
                    }}
                    className={cn(
                      'w-full justify-start rounded-xl min-h-[54px] h-full transition-all duration-200 pr-0',
                      'data-[hover=true]:bg-muted',
                      normalizedSelectedKeys.has(String(item.itemKey))
                        ? 'bg-muted'
                        : 'bg-transparent hover:bg-muted',
                      isDisabled && 'opacity-50 cursor-not-allowed',
                    )}>
                    <div className='flex text-left items-center w-full'>
                      <div className='flex-1'>{item.children}</div>
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

export default Select;
