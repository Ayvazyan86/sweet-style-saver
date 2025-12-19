const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="text-gradient-primary">Дизайн-система</span>{" "}
            <span className="text-foreground">готова</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Стилистика сайта Inflectiv сохранена. Отправьте техническое задание, и я реализую ваш проект.
          </p>
          <div className="flex items-center justify-center gap-8 pt-8">
            <div className="bg-glass rounded-xl p-6 border border-border shadow-glow-primary">
              <p className="text-3xl font-bold text-primary">Cyan</p>
              <p className="text-sm text-muted-foreground">Основной акцент</p>
            </div>
            <div className="bg-glass rounded-xl p-6 border border-border shadow-glow-gold">
              <p className="text-3xl font-bold text-accent">Gold</p>
              <p className="text-sm text-muted-foreground">Вторичный акцент</p>
            </div>
            <div className="bg-glass rounded-xl p-6 border border-border">
              <p className="text-3xl font-bold text-success">Success</p>
              <p className="text-sm text-muted-foreground">Активные состояния</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
