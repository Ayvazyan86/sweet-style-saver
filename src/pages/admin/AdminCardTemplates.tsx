import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Loader2, Move, Upload } from 'lucide-react';
import { Canvas as FabricCanvas, FabricText, FabricImage } from 'fabric';

interface CardTemplate {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  is_default: boolean;
  text_x: number;
  text_y: number;
  text_color: string;
  font_size: number;
  created_at: string;
}

interface TemplateEditorProps {
  onSave: (data: {
    name: string;
    image_url: string;
    text_x: number;
    text_y: number;
    text_color: string;
    font_size: number;
  }) => void;
  onCancel: () => void;
  initialData?: CardTemplate;
}

function TemplateEditor({ onSave, onCancel, initialData }: TemplateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [name, setName] = useState(initialData?.name || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [textColor, setTextColor] = useState(initialData?.text_color || '#FFFFFF');
  const [fontSize, setFontSize] = useState(initialData?.font_size || 48);
  const [textX, setTextX] = useState(initialData?.text_x || 50);
  const [textY, setTextY] = useState(initialData?.text_y || 314);
  const [uploading, setUploading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const textRef = useRef<FabricText | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 314,
      backgroundColor: '#1a1a2e',
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load background image when URL changes
  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    setImageLoaded(false);
    
    FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        // Scale image to fit canvas (1200x628 -> 600x314)
        const scaleX = 600 / (img.width || 1200);
        const scaleY = 314 / (img.height || 628);
        img.scale(Math.min(scaleX, scaleY));
        
        fabricCanvas.backgroundImage = img;
        fabricCanvas.renderAll();
        setImageLoaded(true);
        
        // Add text object after image loads
        addTextObject();
      })
      .catch((err) => {
        console.error('Error loading image:', err);
        toast.error('Ошибка загрузки изображения');
      });
  }, [fabricCanvas, imageUrl]);

  // Add or update text object
  const addTextObject = () => {
    if (!fabricCanvas) return;

    // Remove existing text
    if (textRef.current) {
      fabricCanvas.remove(textRef.current);
    }

    const text = new FabricText('Имя Партнёра\nПрофессия\nГород', {
      left: textX / 2, // Scale from 1200 to 600
      top: textY / 2, // Scale from 628 to 314
      fontSize: fontSize / 2, // Scale font size
      fill: textColor,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'left',
      lineHeight: 1.3,
    });

    text.on('moving', () => {
      setTextX(Math.round((text.left || 0) * 2));
      setTextY(Math.round((text.top || 0) * 2));
    });

    fabricCanvas.add(text);
    textRef.current = text;
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  // Update text properties
  useEffect(() => {
    if (!textRef.current || !fabricCanvas) return;

    textRef.current.set({
      fill: textColor,
      fontSize: fontSize / 2,
    });
    fabricCanvas.renderAll();
  }, [textColor, fontSize, fabricCanvas]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, загрузите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5 МБ');
      return;
    }

    setUploading(true);

    try {
      const fileName = `templates/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('partner-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-photos')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Изображение загружено');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Введите название шаблона');
      return;
    }
    if (!imageUrl) {
      toast.error('Загрузите изображение шаблона');
      return;
    }

    onSave({
      name: name.trim(),
      image_url: imageUrl,
      text_x: textX,
      text_y: textY,
      text_color: textColor,
      font_size: fontSize,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Название шаблона</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Классический тёмный"
          />
        </div>
        <div className="space-y-2">
          <Label>Цвет текста</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Размер шрифта: {fontSize}px</Label>
          <input
            type="range"
            min="24"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Загрузить фон (1200×628)</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        </div>
      </div>

      {/* Canvas preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Move className="w-4 h-4" />
          <span>Перетащите текст мышкой для позиционирования</span>
        </div>
        <div className="border rounded-lg overflow-hidden bg-muted">
          <canvas ref={canvasRef} className="w-full" />
        </div>
        <div className="text-xs text-muted-foreground">
          Позиция текста: X={textX}, Y={textY}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={!name.trim() || !imageUrl}>
          {initialData ? 'Сохранить' : 'Создать шаблон'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminCardTemplates() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['card-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CardTemplate[];
    },
  });

  // Create template
  const createMutation = useMutation({
    mutationFn: async (data: Omit<CardTemplate, 'id' | 'is_active' | 'is_default' | 'created_at'>) => {
      const { error } = await supabase
        .from('card_templates')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      setIsDialogOpen(false);
      toast.success('Шаблон создан');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Ошибка создания шаблона');
    },
  });

  // Update template
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CardTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('card_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast.success('Шаблон обновлён');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Ошибка обновления шаблона');
    },
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('card_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      toast.success('Шаблон удалён');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Ошибка удаления шаблона');
    },
  });

  // Set default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove default from all
      await supabase
        .from('card_templates')
        .update({ is_default: false })
        .neq('id', id);
      
      // Set this as default
      const { error } = await supabase
        .from('card_templates')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      toast.success('Шаблон по умолчанию установлен');
    },
  });

  // Toggle active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('card_templates')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
    },
  });

  const handleSave = (data: {
    name: string;
    image_url: string;
    text_x: number;
    text_y: number;
    text_color: string;
    font_size: number;
  }) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: CardTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
          <p className="text-muted-foreground">
            Управление шаблонами визуальных карточек партнёров
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить шаблон
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
              </DialogTitle>
            </DialogHeader>
            <TemplateEditor
              onSave={handleSave}
              onCancel={handleDialogClose}
              initialData={editingTemplate || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет шаблонов</h3>
            <p className="text-muted-foreground mb-4">
              Добавьте первый шаблон для визуальных карточек партнёров
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить шаблон
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card key={template.id} className={template.is_default ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="p-0">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={template.image_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  {template.is_default && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      По умолчанию
                    </div>
                  )}
                  {!template.is_active && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="text-muted-foreground font-medium">Неактивен</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: template.text_color }}
                    title={`Цвет текста: ${template.text_color}`}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Шрифт: {template.font_size}px | Позиция: {template.text_x}, {template.text_y}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: template.id, is_active: checked })
                      }
                    />
                    <span className="text-sm text-muted-foreground">Активен</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!template.is_default && template.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(template.id)}
                        title="Сделать по умолчанию"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      Изменить
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Шаблон "{template.name}" будет удалён.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(template.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
