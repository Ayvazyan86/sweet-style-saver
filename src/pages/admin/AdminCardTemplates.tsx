export default function AdminCardTemplates() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Шаблоны карточек</h1>
        <p className="text-muted-foreground">
          Управление шаблонами визуальных карточек партнёров
        </p>
      </div>

      {/* Место для новой разметки */}
      <div className="min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Добавьте разметку здесь</p>
      </div>
    </div>
  );
}
