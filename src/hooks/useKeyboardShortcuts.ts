import { useEffect, useCallback } from 'react';
import { DrawAction, SecondaryAction } from '../constants';
import { IDiffItem } from '../Components/InfCanva/types';

interface UseKeyboardShortcutsProps {
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onActionChange: (action: DrawAction) => void;
  currentSelectedShape: unknown;
  prevSteps: IDiffItem[];
  redoSteps: IDiffItem[];
}

export function useKeyboardShortcuts({
  onDelete,
  onUndo,
  onRedo,
  onActionChange,
  currentSelectedShape,
  prevSteps,
  redoSteps,
}: UseKeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Delete key - Delete selected element
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (currentSelectedShape) {
        event.preventDefault();
        onDelete();
      }
    }

    // Undo (Ctrl+Z or Cmd+Z)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      if (prevSteps.length > 0) {
        event.preventDefault();
        onUndo();
      }
    }

    // Redo (Ctrl+Shift+Z or Cmd+Shift+Z)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
      if (redoSteps.length > 0) {
        event.preventDefault();
        onRedo();
      }
    }

        // Tool shortcuts
        const toolShortcuts: Record<string, DrawAction> = {
          '1': DrawAction.Select,
          '2': DrawAction.Rectangle,
          '3': DrawAction.Bubble,
          '4': DrawAction.Text,
          '5': DrawAction.Image,
          '0': DrawAction.Move,
        };

        if (event.key in toolShortcuts) {
          event.preventDefault();
          const action = toolShortcuts[event.key];
          if (action === DrawAction.Image) {
            // Trigger file input for image upload using unique ID
            const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
            if (fileInput) {
              fileInput.click();
            }
          } else {
            onActionChange(action);
          }
        }
  }, [onDelete, onUndo, onRedo, onActionChange, currentSelectedShape, prevSteps, redoSteps]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
