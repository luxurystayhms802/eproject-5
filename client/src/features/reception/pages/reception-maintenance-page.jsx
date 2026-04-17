import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Search, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDisplayName } from '@/features/admin/display-utils';
import {
  formatReceptionDateTime,
  receptionFieldClassName,
  receptionLabelClassName,
  receptionLabelTextClassName,
  receptionTextAreaClassName,
} from '@/features/reception/config';
import {
  useReceptionMaintenanceRequests,
  useCreateReceptionMaintenanceRequest,
} from '@/features/reception/hooks';

const issueTypeOptions = [
  { value: 'ac', label: 'AC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'lock', label: 'Lock' },
  { value: 'internet', label: 'Internet' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'other', label: 'Other' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const initialDraft = {
  locationLabel: '',
  issueType: 'ac',
  priority: 'medium',
  description: '',
};

export const ReceptionMaintenancePage = () => {
  const requestsQuery = useReceptionMaintenanceRequests();
  const createMutation = useCreateReceptionMaintenanceRequest();

  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState(initialDraft);

  const requests = requestsQuery.data ?? [];

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const term = searchQuery.toLowerCase();
    return requests.filter(
      (item) =>
        (item.locationLabel ?? '').toLowerCase().includes(term) ||
        (item.room?.roomNumber ?? '').toString().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.issueType.toLowerCase().includes(term),
    );
  }, [requests, searchQuery]);

  const summary = useMemo(
    () => ({
      total: requests.filter((item) => !['closed', 'resolved'].includes(item.status)).length,
      urgent: requests.filter((item) => item.priority === 'urgent' && !['closed', 'resolved'].includes(item.status)).length,
      open: requests.filter((item) => item.status === 'open').length,
      assigned: requests.filter((item) => Boolean(item.assignedTo) && !['closed', 'resolved'].includes(item.status)).length,
    }),
    [requests],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (draft.description.trim().length < 5) {
      toast.error('Please add a clear description with at least 5 characters.');
      return;
    }
    if (!draft.locationLabel.trim()) {
      toast.error('Please specify the location or room area.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        locationLabel: draft.locationLabel.trim(),
        issueType: draft.issueType,
        priority: draft.priority,
        description: draft.description.trim(),
      });
      setDraft(initialDraft);
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Issues"
        description="Report room or facility maintenance issues and track existing requests submitted by the front desk."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total requests" value={String(summary.total)} description="All visible maintenance items" icon={Wrench} />
        <StatsCard title="Urgent" value={String(summary.urgent)} description="High-severity issues" icon={AlertTriangle} />
        <StatsCard title="Open" value={String(summary.open)} description="Waiting for assignment" icon={Wrench} />
        <StatsCard title="Assigned" value={String(summary.assigned)} description="Owned by maintenance staff" icon={Wrench} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Report an issue</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Submit a maintenance issue that a guest or staff member has reported at the front desk.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Location / Room area</span>
              <input
                className={receptionFieldClassName}
                placeholder="e.g. Room 102, Lobby, Pool area"
                value={draft.locationLabel}
                onChange={(event) => setDraft((current) => ({ ...current, locationLabel: event.target.value }))}
              />
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Issue type</span>
              <select
                className={receptionFieldClassName}
                value={draft.issueType}
                onChange={(event) => setDraft((current) => ({ ...current, issueType: event.target.value }))}
              >
                {issueTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Priority</span>
              <select
                className={receptionFieldClassName}
                value={draft.priority}
                onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={receptionLabelClassName}>
              <span className={receptionLabelTextClassName}>Description</span>
              <textarea
                className={receptionTextAreaClassName}
                rows={4}
                placeholder="Describe the issue in detail"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <div className="flex justify-end">
              <Button type="submit" variant="secondary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Report issue'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                className={`${receptionFieldClassName} pl-11`}
                placeholder="Search location, issue type, or description"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <Button type="button" variant="outline" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          </div>

          {requestsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={request.priority} />
                    <StatusBadge value={request.status} />
                  </div>
                  <div>
                    <h3 className="text-xl text-[var(--primary)] [font-family:var(--font-display)]">
                      {request.room?.roomNumber ? `Room ${request.room.roomNumber}` : request.locationLabel || 'General area'}
                    </h3>
                    <p className="mt-1 text-sm capitalize text-[var(--muted-foreground)]">
                      {request.issueType.replaceAll('_', ' ')} | {request.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>
                      Reported {formatReceptionDateTime(request.reportedAt)} by {getDisplayName(request.reportedBy, 'Staff')}
                    </span>
                    <span className="font-semibold text-[var(--primary)]">
                      {request.assignedTo ? `Assigned to ${getDisplayName(request.assignedTo)}` : 'Unassigned'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No maintenance requests match the current search.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
