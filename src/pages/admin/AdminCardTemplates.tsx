import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Upload, Loader2, ImagePlus, X } from "lucide-react";

interface CardTemplate {
  id: string;
  name: string;
  image_url: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function AdminCardTemplates() {
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["card-templates-admin"],
    queryFn: async () => {
      const { data, error } = await api.cardTemplates.list();

      if (error) throw new Error(error);
      return data as CardTemplate[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.cardTemplates.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
      toast.success("Шаблон удалён");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const uploadAndCreateTemplate = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ""));
    formData.append('description', '');

    const { error } = await api.cardTemplates.create(formData);

    if (error) throw new Error(error);
  };

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      toast.error("Выберите изображения");
      return;
    }

    const newUploadingFiles: UploadingFile[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (const uploadFile of newUploadingFiles) {
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' } : f)
      );

      try {
        await uploadAndCreateTemplate(uploadFile.file);
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadFile.id ? { ...f, status: 'done' } : f)
        );
      } catch (error: any) {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadFile.id ? { ...f, status: 'error' } : f)
        );
        toast.error(`Ошибка загрузки ${uploadFile.file.name}: ${error.message}`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["card-templates-admin"] });
    
    // Очищаем успешно загруженные через 2 секунды
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.status !== 'done'));
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
        <p className="text-muted-foreground">
          Загрузка шаблонов баннеров для партнёров
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Перетащите изображения сюда
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              или нажмите кнопку ниже для выбора файлов
            </p>
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Выбрать файлы
                </span>
              </Button>
            </label>
          </div>

          {/* Uploading Files Preview */}
          {uploadingFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {uploadingFiles.map(file => (
                <div 
                  key={file.id} 
                  className="relative aspect-video rounded-lg overflow-hidden border border-border"
                >
                  <img 
                    src={file.preview} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    ${file.status === 'uploading' ? 'bg-background/80' : ''}
                    ${file.status === 'done' ? 'bg-green-500/20' : ''}
                    ${file.status === 'error' ? 'bg-destructive/20' : ''}
                  `}>
                    {file.status === 'uploading' && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                    {file.status === 'done' && (
                      <span className="text-green-500 text-sm font-medium">✓</span>
                    )}
                    {file.status === 'error' && (
                      <span className="text-destructive text-sm font-medium">Ошибка</span>
                    )}
                  </div>
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeUploadingFile(file.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <Card key={template.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted relative">
                <img
                  src={template.image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Удалить шаблон?")) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
