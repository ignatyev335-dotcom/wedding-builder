import { FileClock } from "lucide-react";

export type AdminAuditLogRow = {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  description: string;
  createdAt: string;
};

export function AuditLogPanel({ logs }: { logs: AdminAuditLogRow[] }) {
  return (
    <section className="admin-panel audit-log-panel">
      <header className="admin-panel-heading">
        <span>
          <FileClock size={18} />
        </span>
        <div>
          <small>Аудит и безопасность</small>
          <h2>Журнал действий</h2>
          <p>История критичных изменений в админке: ключи, каталоги, тарифы и шаблоны.</p>
        </div>
      </header>

      <div className="audit-log-list">
        {logs.map((log) => (
          <article key={log.id}>
            <time>{log.createdAt}</time>
            <div>
              <strong>{log.description || log.action}</strong>
              <small>
                {log.actorEmail ?? "система"} · {log.targetType}
                {log.targetId ? ` · ${log.targetId.slice(0, 8)}` : ""}
              </small>
            </div>
            <span>{log.action}</span>
          </article>
        ))}
        {!logs.length ? (
          <p className="admin-empty-state">Журнал пока пуст. Новые действия начнут попадать сюда автоматически.</p>
        ) : null}
      </div>
    </section>
  );
}
