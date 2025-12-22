import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Star, Upload, Loader2, Pencil } from "lucide-react";

interface CardTemplate {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  is_default: boolean;
  text_color: string;
  text_x: number;
  text_y: number;
  font_size: number;
}

export default function AdminCardTemplates() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    is_active: true,
    is_default: false,
    text_color: "#FFFFFF",
    text_x: 50,
    text_y: 314,
    font_size: 48,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["card-templates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CardTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("card_templates").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон создан");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("card_templates").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон обновлён");
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("card_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase.from("card_templates").update({ is_default: false }).neq("id", "");
      // Then set the new default
      const { error } = await supabase.from("card_templates").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон по умолчанию обновлён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      image_url: "",
      is_active: true,
      is_default: false,
      text_color: "#FFFFFF",
      text_x: 50,
      text_y: 314,
      font_size: 48,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, загрузите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 5MB)");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `template_${Date.now()}.${fileExt}`;
      const filePath = `card-templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("partner-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("partner-photos")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success("Изображение загружено");
    } catch (error: any) {
      toast.error("Ошибка загрузки: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image_url) {
      toast.error("Заполните название и загрузите изображение");
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (template: CardTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      image_url: template.image_url,
      is_active: template.is_active,
      is_default: template.is_default,
      text_color: template.text_color,
      text_x: template.text_x,
      text_y: template.text_y,
      font_size: template.font_size,
    });
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const TemplateForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Название шаблона</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Например: Стандартный шаблон"
        />
      </div>

      <div className="space-y-2">
        <Label>Изображение шаблона</Label>
        <div className="flex gap-2">
          <Input
            value={formData.image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
            placeholder="URL изображения"
            className="flex-1"
          />
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </span>
            </Button>
          </label>
        </div>
        {formData.image_url && (
          <img
            src={formData.image_url}
            alt="Preview"
            className="mt-2 max-h-40 rounded-lg border border-border object-contain"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="text_color">Цвет текста</Label>
          <div className="flex gap-2">
            <Input
              id="text_color"
              type="color"
              value={formData.text_color}
              onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
              className="w-12 h-10 p-1"
            />
            <Input
              value={formData.text_color}
              onChange={(e) => setFormData((prev) => ({ ...prev, text_color: e.target.value }))}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font_size">Размер шрифта</Label>
          <Input
            id="font_size"
            type="number"
            value={formData.font_size}
            onChange={(e) => setFormData((prev) => ({ ...prev, font_size: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="text_x">Позиция X</Label>
          <Input
            id="text_x"
            type="number"
            value={formData.text_x}
            onChange={(e) => setFormData((prev) => ({ ...prev, text_x: Number(e.target.value) }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text_y">Позиция Y</Label>
          <Input
            id="text_y"
            type="number"
            value={formData.text_y}
            onChange={(e) => setFormData((prev) => ({ ...prev, text_y: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Активный</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_default: checked }))}
          />
          <Label htmlFor="is_default">По умолчанию</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={closeDialog}>
          Отмена
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {editingTemplate ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
          <p className="text-muted-foreground">
            Управление шаблонами визуальных карточек партнёров
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTemplate(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить шаблон
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новый шаблон</DialogTitle>
            </DialogHeader>
            <TemplateForm />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Шаблоны ещё не добавлены</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить первый шаблон
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className={`overflow-hidden ${!template.is_active ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={template.image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                {template.is_default && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    По умолчанию
                  </div>
                )}
                {!template.is_active && (
                  <div className="absolute top-2 left-2 bg-muted-foreground/80 text-background px-2 py-1 rounded-md text-xs">
                    Неактивен
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{template.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Редактировать
                  </Button>
                  {!template.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDefaultMutation.mutate(template.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      По умолчанию
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Удалить шаблон?")) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать шаблон</DialogTitle>
          </DialogHeader>
          <TemplateForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
