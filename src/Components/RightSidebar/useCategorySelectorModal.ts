import { useCallback, useEffect, useRef, useState } from 'react';
import useMediaQuery from '../../hooks/use-media-query';

interface CategoryItem {
  category: string;
  [key: string]: any;
}

interface UseCategorySelectorModalOptions {
  isOpen: boolean;
  categories: CategoryItem[];
  includeCustomTab?: boolean;
}

/**
 * Shared hook for category selector modals (Grid, Style)
 * Handles scroll spy, section navigation, and mobile detection
 */
export function useCategorySelectorModal({
  isOpen,
  categories,
  includeCustomTab = false,
}: UseCategorySelectorModalOptions) {
  const { isMobile } = useMediaQuery();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollingToSection = useRef(false);

  // Initialize activeTab when modal opens
  useEffect(() => {
    if (isOpen && !activeTab && categories.length > 0) {
      setActiveTab(categories[0].category);
    }
  }, [isOpen, categories, activeTab]);

  // Reset scroll position when modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Close dropdown when modal closes
  useEffect(() => {
    if (!isOpen && isCatMenuOpen) {
      setIsCatMenuOpen(false);
    }
  }, [isOpen, isCatMenuOpen]);

  // Scroll spy: detect which section is visible
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !isOpen) return;

    const handleScroll = () => {
      if (isScrollingToSection.current) return;

      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      let closestSection = '';
      let closestDistance = Infinity;

      // Find section closest to top of container
      sectionRefs.current.forEach((el, key) => {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = key;
        }
      });

      if (closestSection && closestSection !== activeTab) {
        setActiveTab(closestSection);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen, activeTab]);

  // Scroll to section when tab is clicked
  const scrollToSection = useCallback((sectionKey: string) => {
    const section = sectionRefs.current.get(sectionKey);
    if (!section || !contentRef.current) return;

    isScrollingToSection.current = true;
    setActiveTab(sectionKey);

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Reset flag after scroll animation
    setTimeout(() => {
      isScrollingToSection.current = false;
    }, 500);
  }, []);

  // Register section ref
  const setSectionRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) {
        sectionRefs.current.set(key, el);
      } else {
        sectionRefs.current.delete(key);
      }
    },
    [],
  );

  // Build dropdown menu items
  const menuItems = categories.map(c => ({
    key: c.category,
    name: c.category,
  }));

  if (includeCustomTab) {
    menuItems.push({ key: 'custom', name: 'Custom' });
  }

  return {
    // State
    isMobile,
    activeTab,
    isCatMenuOpen,
    // Refs
    tabsContainerRef,
    contentRef,
    // Actions
    setActiveTab,
    setIsCatMenuOpen,
    scrollToSection,
    setSectionRef,
    // Computed
    menuItems,
  };
}

export default useCategorySelectorModal;
