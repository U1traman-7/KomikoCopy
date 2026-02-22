import React, { useRef } from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { FaImage } from 'react-icons/fa';

interface ImageUploadButtonProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
  tooltipContent?: string;
}

export function ImageUploadButton({ onImageUpload, disabled = false, tooltipContent = "Upload Image" }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Tooltip content={tooltipContent} placement="bottom" delay={500}>
        <Button
          isIconOnly
          size="md"
          className="w-5 bg-muted hover:bg-muted/80"
          onClick={handleClick}
          disabled={disabled}
        >
          <FaImage className="w-4 h-4" />
        </Button>
      </Tooltip>
      <input
        ref={fileInputRef}
        id="image-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  );
}
