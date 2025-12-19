import { useState, useRef } from 'react';
import { Camera, X, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
}

export function PhotoUpload({ value, onChange, className }: PhotoUploadProps) {
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

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-foreground">
        Фото профиля
      </label>
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative">
          <div className={cn(
            'w-24 h-24 rounded-2xl overflow-hidden',
            'bg-card/50 backdrop-blur-sm border border-white/10',
            'flex items-center justify-center',
            'transition-all duration-200',
            value && 'border-primary/30'
          )}>
            {value ? (
              <img 
                src={value} 
                alt="Фото профиля" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          {value && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
            disabled={uploading}
          />
          <label
            htmlFor="photo-upload"
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer',
              'bg-card/50 backdrop-blur-sm border border-white/10',
              'text-sm font-medium text-foreground',
              'hover:border-primary/50 hover:bg-card/70 transition-all duration-200',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Camera className="w-5 h-5 text-primary" />
            {value ? 'Изменить фото' : 'Загрузить фото'}
          </label>
          
          <p className="text-xs text-muted-foreground mt-2">
            JPEG, PNG или WebP, до 5 МБ
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
