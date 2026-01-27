import { useRef, useState } from 'react';
import { Upload, File, Trash2, Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EmployeeDocument } from '@/types/employee';

interface DocumentUploadProps {
  documents: EmployeeDocument[];
  onUpload: (file: File) => void;
  onDelete: (doc: EmployeeDocument) => void;
  onDownload: (doc: EmployeeDocument) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return FileText;
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentUpload({
  documents,
  onUpload,
  onDelete,
  onDownload,
  isUploading,
  disabled,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      onUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!disabled && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: 10MB
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.file_type);
            return (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-muted rounded">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No documents uploaded yet
        </p>
      )}
    </div>
  );
}
