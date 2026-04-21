import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { FileImage, Film, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { JournalUploadProgress } from '@/hooks/useJournal';
import { cn } from '@/lib/utils';
import {
  canOptimizeJournalImage,
  filterJournalMediaFiles,
  formatJournalMediaSize,
} from '@/lib/journalMedia';

interface PendingPreviewItem {
  file: File;
  previewUrl: string;
}

interface JournalMediaUploaderProps {
  title: string;
  description: string;
  selectedFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  progress: JournalUploadProgress | null;
  isUploading?: boolean;
  browseLabel?: string;
  actions?: ReactNode;
}

function getStageLabel(stage: JournalUploadProgress['stage']) {
  switch (stage) {
    case 'preparing':
      return 'Preparing files';
    case 'compressing':
      return 'Compressing image for mobile';
    case 'uploading':
      return 'Uploading media';
    case 'saving':
      return 'Saving attachment record';
    case 'done':
      return 'Upload complete';
    default:
      return 'Uploading media';
  }
}

export function JournalMediaUploader({
  title,
  description,
  selectedFiles,
  onAddFiles,
  onRemoveFile,
  progress,
  isUploading = false,
  browseLabel = 'Add Media',
  actions,
}: JournalMediaUploaderProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const previewItems = useMemo<PendingPreviewItem[]>(
    () => selectedFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [previewItems]);

  const appendFiles = (files: File[]) => {
    if (files.length === 0) return;

    const { accepted, rejected } = filterJournalMediaFiles(files);

    if (rejected.length > 0) {
      toast({
        title: 'Some files were skipped',
        description: 'Only image and video files can be attached to a journal entry.',
        variant: 'destructive',
      });
    }

    if (accepted.length > 0) {
      onAddFiles(accepted);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    appendFiles(Array.from(event.dataTransfer.files || []));
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {browseLabel}
          </Button>
          {actions}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if ((event.key === 'Enter' || event.key === ' ') && !isUploading) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        className={cn(
          'rounded-2xl border border-dashed bg-background/80 px-5 py-7 text-center transition-all',
          isUploading && 'cursor-wait opacity-90',
          !isUploading && 'cursor-pointer hover:border-primary/40 hover:bg-primary/5',
          isDragActive && 'border-primary bg-primary/10 ring-2 ring-primary/15'
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </div>
        <p className="mt-3 text-sm font-semibold">
          {isDragActive ? 'Drop files to queue them' : 'Drag and drop photos or videos here'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Large images are automatically compressed for faster mobile uploads.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            Multiple files supported
          </Badge>
          {selectedFiles.length > 0 && (
            <Badge variant="outline" className="rounded-full">
              {selectedFiles.length} ready to upload
            </Badge>
          )}
        </div>
      </div>

      {progress && (
        <div className="space-y-2 rounded-xl border bg-background/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{getStageLabel(progress.stage)}</p>
              <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                {progress.currentFileName || 'Preparing upload'}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{progress.percent}% complete</p>
              <p>{progress.completed} of {progress.total} finished</p>
            </div>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>
      )}

      {previewItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Files Ready To Upload
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {previewItems.map((item, index) => {
              const isVideo = item.file.type.startsWith('video/');

              return (
                <div
                  key={`${item.file.name}-${index}`}
                  className="relative overflow-hidden rounded-xl border bg-background"
                >
                  {isVideo ? (
                    <div className="relative aspect-video bg-black">
                      <video src={item.previewUrl} className="h-full w-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-black/5">
                      <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-2 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatJournalMediaSize(item.file.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isVideo && canOptimizeJournalImage(item.file) && (
                          <Badge variant="secondary" className="rounded-full px-2 text-[10px]">
                            <FileImage className="mr-1 h-3 w-3" />
                            Smart compress
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    disabled={isUploading}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveFile(index);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
