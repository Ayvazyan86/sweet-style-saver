import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, X, Move } from 'lucide-react';
import { toast } from 'sonner';

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplateElements {
  avatar: ElementPosition;
  name: ElementPosition;
  agency: ElementPosition;
  profession: ElementPosition;
  office: ElementPosition;
}

interface TemplateFormData {
  name: string;
  bannerUrl: string;
  fontFamily: string;
  elements: TemplateElements;
}

const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Playfair Display',
  'PT Sans',
  'Nunito',
  'Ubuntu',
  'Lato',
];

const DEFAULT_ELEMENTS: TemplateElements = {
  avatar: { x: 59, y: 72, width: 200, height: 200 },
  name: { x: 300, y: 80, width: 400, height: 60 },
  agency: { x: 300, y: 160, width: 400, height: 50 },
  profession: { x: 300, y: 230, width: 400, height: 40 },
  office: { x: 300, y: 290, width: 400, height: 40 },
};

const DEMO_DATA = {
  name: 'Айвазян Вардан',
  agency: 'MONETIKA маркетинг в деньги',
  profession: 'Avito специалист',
  office: 'г.Москва, ул. Комсомольская 2',
  avatarUrl: 'https://via.placeholder.com/200',
};

const ELEMENT_LABELS: Record<keyof TemplateElements, string> = {
  avatar: 'Круглая аватарка',
  name: 'ФИО',
  agency: 'Агентство',
  profession: 'Профессия',
  office: 'Офис',
};

const ELEMENT_COLORS: Record<keyof TemplateElements, string> = {
  avatar: 'border-blue-500',
  name: 'border-green-500',
  agency: 'border-yellow-500',
  profession: 'border-purple-500',
  office: 'border-pink-500',
};

// Preview dimensions
const PREVIEW_WIDTH = 600;
const BANNER_WIDTH = 800;
const BANNER_HEIGHT = 450;

export default function AdminCardTemplates() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    bannerUrl: '',
    fontFamily: 'Roboto',
    elements: DEFAULT_ELEMENTS,
  });
  const [uploading, setUploading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<keyof TemplateElements | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const scale = PREVIEW_WIDTH / BANNER_WIDTH;

  const { data: templates, isLoading } = useQuery({
    queryKey: ['card-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { error } = await supabase.from('card_templates').insert({
        name: data.name,
        image_url: data.bannerUrl,
        text_color: '#FFFFFF',
        font_size: 48,
        text_x: data.elements.name.x,
        text_y: data.elements.name.y,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-templates'] });
      toast.success('Шаблон создан');
      resetForm();
    },
    onError: () => {
      toast.error('Ошибка создания шаблона');
    },
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `template-${Date.now()}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, bannerUrl: publicUrl }));
      toast.success('Баннер загружен');
    } catch (error) {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const updateElement = (
    elementKey: keyof TemplateElements,
    field: keyof ElementPosition,
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementKey]: {
          ...prev.elements[elementKey],
          [field]: value,
        },
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bannerUrl: '',
      fontFamily: 'Roboto',
      elements: DEFAULT_ELEMENTS,
    });
    setIsFormOpen(false);
    setSelectedElement(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.bannerUrl) {
      toast.error('Заполните название и загрузите баннер');
      return;
    }
    createMutation.mutate(formData);
  };

  // Drag handlers
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    elementKey: keyof TemplateElements,
    isResize = false
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementKey);
    setIsDragging(!isResize);
    setIsResizing(isResize);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedElement || (!isDragging && !isResizing)) return;
    if (!previewRef.current) return;

    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    setFormData(prev => {
      const element = prev.elements[selectedElement];
      
      if (isDragging) {
        return {
          ...prev,
          elements: {
            ...prev.elements,
            [selectedElement]: {
              ...element,
              x: Math.max(0, Math.min(BANNER_WIDTH - element.width, element.x + deltaX)),
              y: Math.max(0, Math.min(BANNER_HEIGHT - element.height, element.y + deltaY)),
            },
          },
        };
      } else if (isResizing) {
        return {
          ...prev,
          elements: {
            ...prev.elements,
            [selectedElement]: {
              ...element,
              width: Math.max(50, element.width + deltaX),
              height: Math.max(20, element.height + deltaY),
            },
          },
        };
      }
      return prev;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [selectedElement, isDragging, isResizing, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const renderDraggableElement = (
    key: keyof TemplateElements,
    content: React.ReactNode,
    isCircle = false
  ) => {
    const element = formData.elements[key];
    const isSelected = selectedElement === key;

    return (
      <div
        key={key}
        className={`absolute cursor-move border-2 ${isSelected ? ELEMENT_COLORS[key] : 'border-transparent'} ${isSelected ? 'z-10' : 'z-0'} hover:border-white/50 transition-colors`}
        style={{
          left: element.x * scale,
          top: element.y * scale,
          width: element.width * scale,
          height: element.height * scale,
          borderRadius: isCircle ? '50%' : 4,
        }}
        onMouseDown={(e) => handleMouseDown(e, key)}
      >
        {content}
        
        {/* Resize handle */}
        {isSelected && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize rounded-sm"
            onMouseDown={(e) => handleMouseDown(e, key, true)}
          />
        )}

        {/* Label */}
        {isSelected && (
          <div className={`absolute -top-6 left-0 text-xs px-1 py-0.5 rounded text-white ${ELEMENT_COLORS[key].replace('border-', 'bg-')}`}>
            {ELEMENT_LABELS[key]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
          <p className="text-muted-foreground">
            Управление шаблонами визуальных карточек партнёров
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} disabled={isFormOpen}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить шаблон
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-6">
              {/* Left side - Banner upload and preview */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Название шаблона</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Введите название"
                  />
                </div>

                {/* Banner upload area */}
                <div className="space-y-2">
                  <Label>Баннер</Label>
                  {!formData.bannerUrl ? (
                    <div
                      className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      style={{ minHeight: 200 }}
                    >
                      <label className="flex flex-col items-center gap-2 cursor-pointer p-4">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {uploading ? 'Загрузка...' : 'добавить баннер'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Move className="w-4 h-4" />
                        <span>Перетаскивайте элементы на превью для изменения позиции</span>
                      </div>
                      
                      {/* Interactive Preview */}
                      <div
                        ref={previewRef}
                        className="relative border rounded-lg overflow-hidden bg-muted select-none"
                        style={{ 
                          width: PREVIEW_WIDTH, 
                          height: (BANNER_HEIGHT / BANNER_WIDTH) * PREVIEW_WIDTH,
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <img
                          src={formData.bannerUrl}
                          alt="Preview"
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />

                        {/* Avatar */}
                        {renderDraggableElement(
                          'avatar',
                          <div className="w-full h-full rounded-full bg-gray-300 overflow-hidden">
                            <img 
                              src={DEMO_DATA.avatarUrl} 
                              alt="Avatar" 
                              className="w-full h-full object-cover pointer-events-none" 
                              draggable={false}
                            />
                          </div>,
                          true
                        )}

                        {/* Name */}
                        {renderDraggableElement(
                          'name',
                          <div
                            className="w-full h-full flex items-center text-white font-bold truncate pointer-events-none"
                            style={{
                              fontSize: Math.max(12, formData.elements.name.height * scale * 0.6),
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            {DEMO_DATA.name}
                          </div>
                        )}

                        {/* Agency */}
                        {renderDraggableElement(
                          'agency',
                          <div
                            className="w-full h-full flex items-center text-white truncate pointer-events-none"
                            style={{
                              fontSize: Math.max(10, formData.elements.agency.height * scale * 0.5),
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            {DEMO_DATA.agency}
                          </div>
                        )}

                        {/* Profession */}
                        {renderDraggableElement(
                          'profession',
                          <div
                            className="w-full h-full flex items-center text-white truncate pointer-events-none"
                            style={{
                              fontSize: Math.max(10, formData.elements.profession.height * scale * 0.5),
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            {DEMO_DATA.profession}
                          </div>
                        )}

                        {/* Office */}
                        {renderDraggableElement(
                          'office',
                          <div
                            className="w-full h-full flex items-center text-white truncate pointer-events-none"
                            style={{
                              fontSize: Math.max(8, formData.elements.office.height * scale * 0.5),
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            {DEMO_DATA.office}
                          </div>
                        )}

                        {/* Remove banner button */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-20"
                          onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Font selection */}
                <div className="space-y-2">
                  <Label>Выбор шрифта</Label>
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fontFamily: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map(font => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right side - Element coordinates */}
              <div className="w-80 space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Координаты элементов</Label>
                  <p className="text-sm text-muted-foreground">x, y, width, height</p>
                </div>

                {(Object.keys(formData.elements) as Array<keyof TemplateElements>).map((key) => (
                  <div 
                    key={key} 
                    className={`space-y-1 p-2 rounded-lg transition-colors cursor-pointer ${selectedElement === key ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedElement(key)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${ELEMENT_COLORS[key].replace('border-', 'bg-')}`} />
                      <Label className="text-sm cursor-pointer">{ELEMENT_LABELS[key]}</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={Math.round(formData.elements[key].x)}
                        onChange={(e) => updateElement(key, 'x', Number(e.target.value))}
                        placeholder="x"
                        className="text-xs h-8"
                      />
                      <Input
                        type="number"
                        value={Math.round(formData.elements[key].y)}
                        onChange={(e) => updateElement(key, 'y', Number(e.target.value))}
                        placeholder="y"
                        className="text-xs h-8"
                      />
                      <Input
                        type="number"
                        value={Math.round(formData.elements[key].width)}
                        onChange={(e) => updateElement(key, 'width', Number(e.target.value))}
                        placeholder="w"
                        className="text-xs h-8"
                      />
                      <Input
                        type="number"
                        value={Math.round(formData.elements[key].height)}
                        onChange={(e) => updateElement(key, 'height', Number(e.target.value))}
                        placeholder="h"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Сохранение...' : 'Сохранить шаблон'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates list placeholder */}
      {!isFormOpen && (
        <div className="min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">
            {isLoading ? 'Загрузка...' : templates?.length ? `${templates.length} шаблонов` : 'Нет шаблонов'}
          </p>
        </div>
      )}
    </div>
  );
}
