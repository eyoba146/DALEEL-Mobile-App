import { useState, useMemo, useCallback } from 'react';

export function useDynamicCategories<T>(
  moduleKey: string,
  defaultCategories: string[],
  items: T[],
  getItemCategory: (item: T) => string | undefined | null
) {
  const storageKey = `daleel_custom_cats_${moduleKey}`;

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    // 1. Add defaults
    defaultCategories.forEach((cat) => {
      if (cat && cat !== 'All') set.add(cat.trim());
    });
    // 2. Add categories present on live items
    items.forEach((item) => {
      const cat = getItemCategory(item);
      if (cat && cat.trim() && cat !== 'All') {
        set.add(cat.trim());
      }
    });
    // 3. Add stored custom categories
    customCategories.forEach((cat) => {
      if (cat && cat.trim() && cat !== 'All') {
        set.add(cat.trim());
      }
    });
    return Array.from(set);
  }, [defaultCategories, items, customCategories, getItemCategory]);

  const addCategory = useCallback(
    (newCategory: string): string => {
      const trimmed = newCategory.trim();
      if (!trimmed || trimmed.toLowerCase() === 'all') return '';

      // Check if already in allCategories (case-insensitive)
      const existing = allCategories.find(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing;

      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist custom category', e);
      }
      return trimmed;
    },
    [allCategories, customCategories, storageKey]
  );

  const removeCategory = useCallback(
    (categoryToRemove: string) => {
      const updated = customCategories.filter(
        (c) => c.toLowerCase() !== categoryToRemove.toLowerCase()
      );
      setCustomCategories(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove custom category', e);
      }
    },
    [customCategories, storageKey]
  );

  return {
    categories: allCategories,
    addCategory,
    removeCategory,
  };
}
