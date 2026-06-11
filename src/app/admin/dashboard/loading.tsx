export default function AdminLoading() {
  return (
    <main className="portal-loading" aria-busy="true">
      <span className="brand">vowly</span>
      <div className="portal-loading-copy">
        <i />
        <h1>Обновляем метрики платформы</h1>
        <p>Загружаем пользователей, проекты и системные настройки.</p>
      </div>
      <div className="portal-skeleton-card"><i /><i /><i /><i /></div>
    </main>
  );
}
