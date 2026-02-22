import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// API helpers
async function fetchCustomStyles(): Promise<string[]> {
  const res = await fetch('/api/customStyles', { credentials: 'include' });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error('Failed to fetch styles');
  const data = await res.json();
  return data.styles || [];
}

async function addCustomStyleAPI(style: string): Promise<void> {
  const res = await fetch('/api/customStyles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style }),
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('login_required');
  if (res.status === 409) throw new Error('style_exists');
  if (!res.ok) throw new Error('Failed to add style');
}

async function deleteCustomStyleAPI(style: string): Promise<void> {
  const res = await fetch('/api/customStyles', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style }),
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('login_required');
  if (!res.ok) throw new Error('Failed to delete style');
}

async function updateCustomStyleAPI(
  oldStyle: string,
  newStyle: string,
): Promise<void> {
  const res = await fetch('/api/customStyles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldStyle, newStyle }),
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('login_required');
  if (res.status === 409) throw new Error('style_exists');
  if (res.status === 404) throw new Error('style_not_found');
  if (!res.ok) throw new Error('Failed to update style');
}

export function useCustomStyles() {
  const { t } = useTranslation('create');
  const [customStyles, setCustomStyles] = useState<string[]>([]);
  const [newCustomStyle, setNewCustomStyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStyle, setEditingStyle] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingStyle, setDeletingStyle] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const loadStyles = useCallback(async () => {
    setIsLoading(true);
    try {
      const styles = await fetchCustomStyles();
      setCustomStyles(styles);
    } catch (e) {
      console.error('Failed to fetch custom styles', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOnce = useCallback(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadStyles();
  }, [loadStyles]);

  const addStyle = useCallback(async () => {
    const trimmed = newCustomStyle.trim();
    if (!trimmed) return;

    if (trimmed.length > 100) {
      toast.error(t('style_too_long') || 'Style text too long (max 100 chars)');
      return;
    }

    if (customStyles.includes(trimmed)) {
      toast.error(t('style_exists') || 'Style already exists');
      return;
    }

    setIsSaving(true);
    try {
      await addCustomStyleAPI(trimmed);
      setCustomStyles(prev => [...prev, trimmed]);
      setNewCustomStyle('');
      toast.success(t('style_added') || 'Custom style added', {
        position: 'top-center',
      });
    } catch (e: any) {
      if (e.message === 'login_required') {
        toast.error(
          t('login_required') || 'Please log in to save custom styles',
        );
      } else if (e.message === 'style_exists') {
        toast.error(t('style_exists') || 'Style already exists', {
          position: 'top-center',
        });
      } else {
        toast.error(t('style_add_failed') || 'Failed to add style', {
          position: 'top-center',
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [newCustomStyle, customStyles, t]);

  const deleteStyle = useCallback(
    async (styleToDelete: string) => {
      if (deletingStyle) return; // prevent double delete
      setDeletingStyle(styleToDelete);
      try {
        await deleteCustomStyleAPI(styleToDelete);
        setCustomStyles(prev => prev.filter(s => s !== styleToDelete));
        toast.success(t('style_deleted') || 'Custom style deleted', {
          position: 'top-center',
        });
      } catch (e: any) {
        if (e.message === 'login_required') {
          toast.error(t('login_required') || 'Please log in', {
            position: 'top-center',
          });
        } else {
          toast.error(t('style_delete_failed') || 'Failed to delete style', {
            position: 'top-center',
          });
        }
      } finally {
        setDeletingStyle(null);
      }
    },
    [t, deletingStyle],
  );

  const startEdit = useCallback((style: string) => {
    setEditingStyle(style);
    setEditValue(style);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingStyle(null);
    setEditValue('');
  }, []);

  // Returns { success: boolean, oldStyle?: string, newStyle?: string }
  const saveEdit = useCallback(async (): Promise<{
    success: boolean;
    oldStyle?: string;
    newStyle?: string;
  }> => {
    if (!editingStyle) return { success: false };
    const trimmed = editValue.trim();

    if (!trimmed) {
      toast.error(t('style_required') || 'Style cannot be empty', {
        position: 'top-center',
      });
      return { success: false };
    }

    if (trimmed.length > 100) {
      toast.error(
        t('style_too_long') || 'Style text too long (max 100 chars)',
        {
          position: 'top-center',
        },
      );
      return { success: false };
    }

    if (trimmed === editingStyle) {
      cancelEdit();
      return { success: true };
    }

    setIsSaving(true);
    try {
      await updateCustomStyleAPI(editingStyle, trimmed);
      const oldStyle = editingStyle;
      setCustomStyles(prev => prev.map(s => (s === oldStyle ? trimmed : s)));
      toast.success(t('style_updated') || 'Style updated');
      cancelEdit();
      return { success: true, oldStyle, newStyle: trimmed };
    } catch (e: any) {
      if (e.message === 'login_required') {
        toast.error(t('login_required') || 'Please log in', {
          position: 'top-center',
        });
      } else if (e.message === 'style_exists') {
        toast.error(t('style_exists') || 'Style already exists', {
          position: 'top-center',
        });
      } else {
        toast.error(t('style_update_failed') || 'Failed to update style', {
          position: 'top-center',
        });
      }
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [editingStyle, editValue, t, cancelEdit]);

  return {
    // State
    customStyles,
    newCustomStyle,
    setNewCustomStyle,
    isLoading,
    isSaving,
    editingStyle,
    editValue,
    setEditValue,
    deletingStyle,
    // Actions
    loadOnce,
    refresh: loadStyles,
    addStyle,
    deleteStyle,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}

