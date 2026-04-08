import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMaintenanceHistory } from '@/features/maintenance/hooks';
const formatIssueType = (value) => value.replaceAll('_', ' ');
export const MaintenanceHistoryPage = () => {
    const { data, isLoading } = useMaintenanceHistory();
    const requests = data ?? [];
    return (<div className="space-y-6">
      <PageHeader title="Closed Requests History" description="Review resolved incidents and formally close work items after final verification."/>
      <Card className="overflow-x-auto">
        {isLoading ? (<div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (<div key={index} className="h-16 animate-pulse rounded-2xl bg-white/70"/>))}
          </div>) : requests.length > 0 ? (<table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <tr>
                <th className="pb-4">Location</th>
                <th className="pb-4">Issue</th>
                <th className="pb-4">Resolved</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {requests.map((item) => (<tr key={item.id}>
                  <td className="py-4">{item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}</td>
                  <td className="py-4">
                    <p className="capitalize">{formatIssueType(item.issueType)}</p>
                    <p className="text-[var(--muted-foreground)]">{item.resolutionNotes ?? 'Resolution recorded'}</p>
                  </td>
                  <td className="py-4">{item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : 'n/a'}</td>
                  <td className="py-4">
                    <StatusBadge value={item.status}/>
                  </td>
                  <td className="py-4">
                    <span className="text-[var(--muted-foreground)]">
                      {item.status === 'closed' ? 'Closed' : 'Resolved'}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No resolved or closed maintenance history is available yet.
          </div>)}
      </Card>
    </div>);
};
