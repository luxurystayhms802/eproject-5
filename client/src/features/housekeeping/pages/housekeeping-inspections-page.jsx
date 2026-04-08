import { ShieldCheck, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { downloadCsv } from '@/lib/export-documents';
import { printManagementReportDocument } from '@/lib/print-documents';
import { useCreateMaintenanceIssue, useHousekeepingBoard } from '@/features/housekeeping/hooks';

const inputClassName =
  'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';

export const HousekeepingInspectionsPage = () => {
  const boardQuery = useHousekeepingBoard();
  const createMaintenanceIssue = useCreateMaintenanceIssue();
  const [roomId, setRoomId] = useState('');
  const [issueType, setIssueType] = useState('ac');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');

  const board = boardQuery.data;
  const inspectedRooms = board?.groups?.inspected ?? [];
  const cleanRooms = board?.groups?.clean ?? [];
  const releaseCandidates = [...inspectedRooms, ...cleanRooms];

  const reportRows = useMemo(
    () =>
      releaseCandidates.map((room) => ({
        room: room.roomNumber,
        floor: room.floor,
        room_status: room.status,
        housekeeping_status: room.housekeepingStatus,
        active_task: room.activeTask?.status ?? 'none',
      })),
    [releaseCandidates],
  );

  const submitIssue = (event) => {
    event.preventDefault();

    if (!roomId) {
      toast.error('Select a room before reporting a maintenance issue.');
      return;
    }

    if (description.trim().length < 8) {
      toast.error('Add a clear issue description with at least 8 characters.');
      return;
    }

    createMaintenanceIssue.mutate(
      {
        roomId,
        issueType,
        priority,
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setRoomId('');
          setDescription('');
        },
      },
    );
  };

  const handlePrint = () => {
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Housekeeping',
      title: 'Inspection & Release Report',
      subtitle: 'Room release candidates and inspection posture.',
      rangeLabel: new Date().toLocaleDateString(),
      metrics: [
        { label: 'Inspected', value: String(inspectedRooms.length), helper: 'Ready for release review' },
        { label: 'Clean', value: String(cleanRooms.length), helper: 'Already restored' },
        { label: 'Release candidates', value: String(releaseCandidates.length), helper: 'Inspected plus clean rooms' },
      ],
      sections: [
        {
          title: 'Release queue',
          rows: releaseCandidates.map((room) => ({
            label: `Room ${room.roomNumber}`,
            value: room.housekeepingStatus,
            helper: `Floor ${room.floor} | ${room.status}`,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" description="Review room release candidates and escalate issues before front-desk reuse.">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            Print report
          </Button>
          <Button variant="outline" onClick={() => downloadCsv('housekeeping-inspections.csv', reportRows)} disabled={reportRows.length === 0}>
            Export CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Inspected" value={String(inspectedRooms.length)} description="Awaiting release review" icon={ShieldCheck} />
        <StatsCard title="Clean" value={String(cleanRooms.length)} description="Ready now" icon={ShieldCheck} />
        <StatsCard title="Candidates" value={String(releaseCandidates.length)} description="Release shortlist" icon={Wrench} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card>
          <form className="space-y-4" onSubmit={submitIssue}>
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Escalate room issue</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Escalate anything blocking release back to inventory.</p>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Room</span>
              <select className={inputClassName} value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                <option value="">Select room</option>
                {releaseCandidates.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Issue type</span>
              <select className={inputClassName} value={issueType} onChange={(event) => setIssueType(event.target.value)}>
                {['ac', 'plumbing', 'electricity', 'furniture', 'lock', 'internet', 'bathroom', 'appliance', 'other'].map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Priority</span>
              <select className={inputClassName} value={priority} onChange={(event) => setPriority(event.target.value)}>
                {['low', 'medium', 'high', 'urgent'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Description</span>
              <textarea className={`${inputClassName} min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>

            <Button type="submit" disabled={createMaintenanceIssue.isPending || releaseCandidates.length === 0}>
              {createMaintenanceIssue.isPending ? 'Reporting...' : 'Report issue'}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--primary)]">Release candidates</h2>
          {boardQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : releaseCandidates.length > 0 ? (
            <div className="grid gap-3">
              {releaseCandidates.map((room) => (
                <div key={room.id} className="rounded-[22px] border border-[var(--border)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--primary)]">Room {room.roomNumber}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Floor {room.floor}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge value={room.housekeepingStatus} />
                      <StatusBadge value={room.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-sm text-[var(--muted-foreground)]">
              No inspected or clean rooms are waiting for review.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
