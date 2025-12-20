import { useState, useRef } from 'react';
import { Camera, X, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
  compact?: boolean;
}

export function PhotoUpload({ value, onChange, className, compact = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валидация
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Поддерживаются только JPEG, PNG и WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Максимальный размер файла 5 МБ');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Загружаем файл
      const { error: uploadError } = await supabase.storage
        .from('partner-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Ошибка загрузки файла');
        return;
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('partner-photos')
        .getPublicUrl(fileName);

      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
  };

  const handleClick = () => {
    if (!uploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={cn('flex flex-col', compact ? 'items-start' : 'items-center', className)}>
      {/* Clickable Avatar */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className={cn(
            'rounded-2xl overflow-hidden',
            'bg-card/50 backdrop-blur-sm border-2 border-dashed border-white/20',
            'flex items-center justify-center',
            'transition-all duration-200 cursor-pointer',
            'hover:border-primary/50 hover:bg-card/70',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            value && 'border-solid border-primary/30',
            uploading && 'opacity-50 cursor-not-allowed',
            compact ? 'w-20 h-20' : 'w-24 h-24'
          )}
        >
          {value ? (
            <img 
              src={value} 
              alt="Фото профиля" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <User className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
              <Camera className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Hover overlay */}
          {!uploading && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Camera className="w-6 h-6 text-primary" />
            </div>
          )}
        </button>
        
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <X className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}