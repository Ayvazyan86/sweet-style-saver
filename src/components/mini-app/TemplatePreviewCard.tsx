import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PartnerData {
  name: string;
  age: string;
  profession: string;
  city: string;
  agency_name: string;
  photo_url: string;
}

interface TemplateData {
  image_url: string;
  text_x: number;
  text_y: number;
  text_color: string;
  font_size: number;
}

interface TemplatePreviewCardProps {
  partnerData: PartnerData;
  template: TemplateData | null;
  className?: string;
}

export function TemplatePreviewCard({ partnerData, template, className = '' }: TemplatePreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!template || !canvasRef.current) {
      setLoading(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    setError(null);

    // Размеры карточки
    const width = 800;
    const height = 450;
    canvas.width = width;
    canvas.height = height;

    const templateImage = new Image();
    templateImage.crossOrigin = 'anonymous';

    templateImage.onload = async () => {
      // Рисуем фон шаблона
      ctx.drawImage(templateImage, 0, 0, width, height);

      // Рисуем фото партнёра (круг слева)
      const photoRadius = 80;
      const photoCenterX = 120;
      const photoCenterY = 225;

      if (partnerData.photo_url) {
        const photoImage = new Image();
        photoImage.crossOrigin = 'anonymous';
        
        photoImage.onload = () => {
          // Сохраняем контекст
          ctx.save();
          
          // Создаём круглую маску
          ctx.beginPath();
          ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // Рисуем изображение в центре круга
          const size = photoRadius * 2;
          ctx.drawImage(photoImage, photoCenterX - photoRadius, photoCenterY - photoRadius, size, size);
          
          // Восстанавливаем контекст
          ctx.restore();
          
          drawText(ctx);
          setLoading(false);
        };

        photoImage.onerror = () => {
          drawPlaceholder(ctx, photoCenterX, photoCenterY, photoRadius);
          drawText(ctx);
          setLoading(false);
        };

        photoImage.src = partnerData.photo_url;
      } else {
        drawPlaceholder(ctx, photoCenterX, photoCenterY, photoRadius);
        drawText(ctx);
        setLoading(false);
      }
    };

    templateImage.onerror = () => {
      setError('Не удалось загрузить шаблон');
      setLoading(false);
    };

    templateImage.src = template.image_url;

    function drawPlaceholder(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#374151';
      ctx.fill();
      
      // Инициалы или иконка
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = partnerData.name ? partnerData.name.charAt(0).toUpperCase() : '?';
      ctx.fillText(initial, cx, cy);
    }

    function drawText(ctx: CanvasRenderingContext2D) {
      if (!template) return;
      
      const { text_x, text_y, text_color, font_size } = template;
      
      // Имя партнёра
      ctx.font = `bold ${font_size}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = text_color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(partnerData.name || 'Партнёр', text_x, text_y);
      
      // Город и возраст
      const locationAge = [partnerData.city, partnerData.age ? `${partnerData.age} лет` : null]
        .filter(Boolean)
        .join(', ');
      
      if (locationAge) {
        ctx.font = `${Math.round(font_size * 0.6)}px Arial, Helvetica, sans-serif`;
        ctx.globalAlpha = 0.9;
        ctx.fillText(locationAge, text_x, text_y + font_size + 10);
        ctx.globalAlpha = 1;
      }
      
      // Профессия или агентство
      const subtitle = partnerData.profession || partnerData.agency_name;
      if (subtitle) {
        ctx.font = `${Math.round(font_size * 0.5)}px Arial, Helvetica, sans-serif`;
        ctx.globalAlpha = 0.8;
        ctx.fillText(subtitle, text_x, text_y + font_size * 2 + 20);
        ctx.globalAlpha = 1;
      }
    }

  }, [template, partnerData]);

  if (!template) {
    return (
      <div className={`aspect-video bg-card/50 rounded-xl border border-white/10 flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-sm">Выберите шаблон для предпросмотра</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden border border-white/10 ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
      
      {loading && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
