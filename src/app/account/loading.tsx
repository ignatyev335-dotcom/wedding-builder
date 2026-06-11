export default function AccountLoading() {
  return <PortalSkeleton title="Загружаем ваши проекты" />;
}

function PortalSkeleton({ title }: { title: string }) {
  return (
    <main className="portal-loading" aria-busy="true">
      <span className="brand">vowly</span>
      <div className="portal-loading-copy">
        <i />
        <h1>{title}</h1>
        <p>Собираем свежие ответы гостей и настройки публикации.</p>
      </div>
      <div className="portal-skeleton-card"><i /><i /><i /><i /></div>
    </main>
  );
}
