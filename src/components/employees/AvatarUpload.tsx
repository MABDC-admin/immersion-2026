import { useRef, useState } from 'react';
import { Upload, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string;
  initials: string;
  onUpload: (file: File) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function AvatarUpload({ currentUrl, initials, onUpload, isUploading, disabled }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onUpload(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-card">
          <AvatarImage src={preview || currentUrl || ''} alt="Avatar" />
          <AvatarFallback className="text-2xl bg-muted text-foreground">
            {initials || <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
              isUploading && 'opacity-100'
            )}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Change Photo'}
        </Button>
      )}
    </div>
  );
}
