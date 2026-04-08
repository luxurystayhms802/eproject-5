import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAssignMaintenanceRequest, useMaintenanceOpenRequests, useResolveMaintenanceRequest } from '@/features/maintenance/hooks';
import { useAuthStore } from '@/app/store/auth-store';
const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';
const formatIssueType = (value) => value.replaceAll('_', ' ');
export const MaintenanceRequestsPage = () => {
    const { data, isLoading } = useMaintenanceOpenRequests();
    const user = useAuthStore((state) => state.user);
    const assignRequest = useAssignMaintenanceRequest();
    const resolveRequest = useResolveMaintenanceRequest();
    const [notesById, setNotesById] = useState({});
    const requests = data ?? [];
    const currentUserId = user?.id ?? user?._id ?? null;
    const handleAssignToMe = (requestId) => {
        if (!currentUserId) {
            toast.error('Your technician account is not ready for assignment yet.');
            return;
        }
        assignRequest.mutate({ requestId, assignedToUserId: currentUserId });
    };
    const handleResolve = (requestId) => {
        const notes = (notesById[requestId] ?? '').trim();
        if (!notes) {
            toast.error('Please add resolution notes before resolving this request.');
            return;
        }
        resolveRequest.mutate({
            requestId,
            resolutionNotes: notes,
        });
    };
    return (<div className="space-y-6">
      <PageHeader title="Open Requests" description="Assign incoming issues, add resolution notes, and move room-impacting incidents toward closure."/>
      <Card className="overflow-x-auto">
        {isLoading ? (<div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (<div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70"/>))}
          </div>) : requests.length > 0 ? (<table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <tr>
                <th className="pb-4">Location</th>
                <th className="pb-4">Issue</th>
                <th className="pb-4">Priority</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {requests.map((item) => (<tr key={item.id}>
                  <td className="py-4">
                    <p className="font-semibold text-[var(--primary)]">{item.room?.roomNumber ? `Room ${item.room.roomNumber}` : item.locationLabel ?? 'General area'}</p>
                    <p className="text-[var(--muted-foreground)]">{item.assignedTo?.fullName ?? 'Unassigned'}</p>
                  </td>
                  <td className="py-4">
                    <p className="capitalize">{formatIssueType(item.issueType)}</p>
                    <p className="text-[var(--muted-foreground)]">{item.description}</p>
                  </td>
                  <td className="py-4">
                    <StatusBadge value={item.priority}/>
                  </td>
                  <td className="py-4">
                    <StatusBadge value={item.status}/>
                  </td>
                  <td className="py-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" disabled={!currentUserId || Boolean(item.assignedTo) || assignRequest.isPending} onClick={() => handleAssignToMe(item.id)}>
                          {item.assignedTo?.id === currentUserId || item.assignedTo?._id === currentUserId ? 'Assigned to you' : 'Assign to me'}
                        </Button>
                        <Button disabled={resolveRequest.isPending} onClick={() => handleResolve(item.id)}>
                          Resolve
                        </Button>
                      </div>
                      <input className={inputClassName} placeholder="Resolution notes" value={notesById[item.id] ?? ''} onChange={(event) => setNotesById((current) => ({ ...current, [item.id]: event.target.value }))}/>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
            No open maintenance requests are waiting right now.
          </div>)}
      </Card>
    </div>);
};
