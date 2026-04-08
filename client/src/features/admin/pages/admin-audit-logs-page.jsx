import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card } from '@/components/ui/card';
import { useAuditLogs } from '@/features/audit/hooks';
import { adminInputClassName, formatAdminDateTime } from '@/features/admin/config';
import { getDisplayName } from '@/features/admin/display-utils';

const resolveActor = (userId) => {
  if (userId && typeof userId === 'object') {
    return getDisplayName(userId, userId.email ?? 'System');
  }

  return String(userId ?? 'System');
};

export const AdminAuditLogsPage = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAuditLogs();
  const logs = data ?? [];

  const filteredLogs = useMemo(() => {
    if (!search.trim()) {
      return logs;
    }

    const expression = search.trim().toLowerCase();
    return logs.filter((log) =>
      [log.action, log.entityType, log.entityId, resolveActor(log.userId), log.ip]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(expression)),
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Trace critical user actions, entity changes, and operational history for evaluation, governance, and hotel-grade accountability."
      />

      <Card className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            className={`${adminInputClassName} pl-11`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by action, entity, actor, or IP"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id ?? log._id ?? `${log.action}-${log.entityId}`} className="rounded-[24px] border border-[var(--border)] bg-white/76 p-5 shadow-[0_16px_34px_rgba(16,36,63,0.05)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value="active" className="bg-blue-100 text-blue-700" />
                      <StatusBadge value={log.entityType} className="bg-slate-100 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-xl text-[var(--primary)] [font-family:var(--font-display)]">{log.action}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{log.entityType} | {log.entityId}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
                      <span>
                        Actor: <strong className="font-semibold text-[var(--primary)]">{resolveActor(log.userId)}</strong>
                      </span>
                      <span>
                        IP: <strong className="font-semibold text-[var(--primary)]">{log.ip || 'n/a'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="min-w-[220px] rounded-[22px] border border-[var(--border)] bg-white/84 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Captured at</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{formatAdminDateTime(log.createdAt)}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{log.userAgent || 'User agent not captured'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No audit logs match the current search.
          </div>
        )}
      </Card>
    </div>
  );
};
