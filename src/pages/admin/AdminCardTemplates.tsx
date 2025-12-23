import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";

interface CardTemplate {
  id: string;
  name: string;
  image_url: string;
}

export default function AdminCardTemplates() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["card-templates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_templates")
        .select("id, name, image_url")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CardTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("card_templates").insert([{ 
        name, 
        image_url: imageUrl 
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон добавлен");
      setName("");
      setImageUrl("");
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

      setImageUrl(urlData.publicUrl);
      toast.success("Изображение загружено");
    } catch (error: any) {
      toast.error("Ошибка загрузки: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      toast.error("Заполните название и загрузите изображение");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
        <p className="text-muted-foreground">
          Загрузка шаблонов баннеров для партнёров
        </p>
      </div>

      {/* Add Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название шаблона"
              />
            </div>

            <div className="space-y-2">
              <Label>Изображение</Label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" className="w-full" disabled={uploading} asChild>
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? "Загрузка..." : "Выбрать файл"}
                    </span>
                  </Button>
                </label>
              </div>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-2 max-h-40 rounded-lg border border-border object-contain"
                />
              )}
            </div>

            <Button type="submit" disabled={createMutation.isPending || !name || !imageUrl}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Plus className="h-4 w-4 mr-2" />
              Добавить шаблон
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates?.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Шаблоны ещё не добавлены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src={template.image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 flex items-center justify-between">
                <h3 className="font-medium truncate">{template.name}</h3>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Удалить шаблон?")) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
