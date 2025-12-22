import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, X } from 'lucide-react';
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
  avatar: { x: 59, y: 72, width: 699, height: 699 },
  name: { x: 1453, y: 80, width: 447, height: 201 },
  agency: { x: 1000, y: 439, width: 893, height: 259 },
  profession: { x: 1185, y: 774, width: 708, height: 169 },
  office: { x: 512, y: 1052, width: 1371, height: 69 },
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

export default function AdminCardTemplates() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    bannerUrl: '',
    fontFamily: 'Roboto',
    elements: DEFAULT_ELEMENTS,
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

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
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.bannerUrl) {
      toast.error('Заполните название и загрузите баннер');
      return;
    }
    createMutation.mutate(formData);
  };

  // Calculate scale for preview
  const PREVIEW_WIDTH = 400;
  const BANNER_WIDTH = 1920; // Assumed original banner width
  const scale = PREVIEW_WIDTH / BANNER_WIDTH;

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
              {/* Left side - Banner upload and font selection */}
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
                  <div
                    className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    style={{ minHeight: 200 }}
                  >
                    {formData.bannerUrl ? (
                      <>
                        <img
                          src={formData.bannerUrl}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
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
                    )}
                  </div>
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
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Координаты элементов</Label>
                  <p className="text-sm text-muted-foreground">x, y, width, height</p>
                </div>

                {(Object.keys(formData.elements) as Array<keyof TemplateElements>).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm">{ELEMENT_LABELS[key]}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={formData.elements[key].x}
                        onChange={(e) => updateElement(key, 'x', Number(e.target.value))}
                        placeholder="x"
                      />
                      <Input
                        type="number"
                        value={formData.elements[key].y}
                        onChange={(e) => updateElement(key, 'y', Number(e.target.value))}
                        placeholder="y"
                      />
                      <Input
                        type="number"
                        value={formData.elements[key].width}
                        onChange={(e) => updateElement(key, 'width', Number(e.target.value))}
                        placeholder="w"
                      />
                      <Input
                        type="number"
                        value={formData.elements[key].height}
                        onChange={(e) => updateElement(key, 'height', Number(e.target.value))}
                        placeholder="h"
                      />
                    </div>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground mt-4">
                  Добавьте разметку здесь
                </p>
              </div>
            </div>

            {/* Live Preview */}
            {formData.bannerUrl && (
              <div className="mt-6 space-y-2">
                <Label className="text-base font-semibold">Превью карточки</Label>
                <div
                  className="relative border rounded-lg overflow-hidden bg-muted"
                  style={{ width: PREVIEW_WIDTH, aspectRatio: '16/9' }}
                >
                  <img
                    src={formData.bannerUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Avatar */}
                  <div
                    className="absolute rounded-full bg-gray-300 overflow-hidden border-2 border-white"
                    style={{
                      left: formData.elements.avatar.x * scale,
                      top: formData.elements.avatar.y * scale,
                      width: formData.elements.avatar.width * scale,
                      height: formData.elements.avatar.height * scale,
                    }}
                  >
                    <img src={DEMO_DATA.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  {/* Name */}
                  <div
                    className="absolute text-white font-bold truncate"
                    style={{
                      left: formData.elements.name.x * scale,
                      top: formData.elements.name.y * scale,
                      width: formData.elements.name.width * scale,
                      height: formData.elements.name.height * scale,
                      fontSize: 14 * scale * 3,
                      fontFamily: formData.fontFamily,
                    }}
                  >
                    {DEMO_DATA.name}
                  </div>
                  {/* Agency */}
                  <div
                    className="absolute text-white truncate"
                    style={{
                      left: formData.elements.agency.x * scale,
                      top: formData.elements.agency.y * scale,
                      width: formData.elements.agency.width * scale,
                      height: formData.elements.agency.height * scale,
                      fontSize: 10 * scale * 3,
                      fontFamily: formData.fontFamily,
                    }}
                  >
                    {DEMO_DATA.agency}
                  </div>
                  {/* Profession */}
                  <div
                    className="absolute text-white truncate"
                    style={{
                      left: formData.elements.profession.x * scale,
                      top: formData.elements.profession.y * scale,
                      width: formData.elements.profession.width * scale,
                      height: formData.elements.profession.height * scale,
                      fontSize: 10 * scale * 3,
                      fontFamily: formData.fontFamily,
                    }}
                  >
                    {DEMO_DATA.profession}
                  </div>
                  {/* Office */}
                  <div
                    className="absolute text-white truncate"
                    style={{
                      left: formData.elements.office.x * scale,
                      top: formData.elements.office.y * scale,
                      width: formData.elements.office.width * scale,
                      height: formData.elements.office.height * scale,
                      fontSize: 8 * scale * 3,
                      fontFamily: formData.fontFamily,
                    }}
                  >
                    {DEMO_DATA.office}
                  </div>
                </div>
              </div>
            )}

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
