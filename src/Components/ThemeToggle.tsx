import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from '@nextui-org/react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly variant='light' size='sm' className='h-8 sm:h-10'>
        <Sun className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />
      </Button>
    );
  }

  const getCurrentIcon = () => {
    if (theme === 'light')
      return <Sun className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />;
    if (theme === 'dark')
      return <Moon className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />;
    return <Monitor className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />;
  };

  const handleSelect = (newTheme: string) => {
    setIsOpen(false);
    // Delay theme change slightly so popover closes first
    requestAnimationFrame(() => {
      setTheme(newTheme);
    });
  };

  const options = [
    { key: 'light', label: 'Light', icon: <Sun className='h-4 w-4' /> },
    { key: 'dark', label: 'Dark', icon: <Moon className='h-4 w-4' /> },
    { key: 'system', label: 'System', icon: <Monitor className='h-4 w-4' /> },
  ];

  return (
    <Popover placement='bottom' isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          isIconOnly
          variant='light'
          size='sm'
          className='h-8 sm:h-10'
          aria-label='Toggle theme'>
          {getCurrentIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='!justify-start p-0'>
        <div className='p-2'>
          {options.map(opt => (
            <Button
              key={opt.key}
              variant='light'
              className='justify-start mb-1 w-full gap-2'
              onPress={() => handleSelect(opt.key)}>
              {opt.icon}
              {opt.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
