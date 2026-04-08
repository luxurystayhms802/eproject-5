import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreateMaintenanceIssue, useHousekeepingBoard } from '@/features/housekeeping/hooks';
const inputClassName = 'w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]';
const formatIssueType = (value) => value.replaceAll('_', ' ');
export const RoomCleaningBoardPage = () => {
    const { data, isLoading } = useHousekeepingBoard();
    const createMaintenanceIssue = useCreateMaintenanceIssue();
    const allRooms = useMemo(() => Object.values(data?.groups ?? {}).flat(), [data]);
    const [roomId, setRoomId] = useState('');
    const [issueType, setIssueType] = useState('ac');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');
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
        createMaintenanceIssue.mutate({
            roomId,
            issueType,
            priority,
            description: description.trim(),
        }, {
            onSuccess: () => {
                setRoomId('');
                setDescription('');
            },
        });
    };
    return (<div className="space-y-6">
      <PageHeader title="Room Cleaning Board" description="Visual room readiness by housekeeping state, with inline issue escalation when a room cannot be released."/>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {['dirty', 'in_progress', 'inspected', 'clean'].map((key) => (<Card key={key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{key.replaceAll('_', ' ')}</h2>
                <StatusBadge value={key}/>
              </div>
              <div className="space-y-3">
                {isLoading ? (<div className="h-24 animate-pulse rounded-2xl bg-white/70"/>) : (data?.groups[key] ?? []).length > 0 ? (data?.groups[key].map((room) => (<div key={room.id} className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                      <p className="font-semibold text-[var(--primary)]">Room {room.roomNumber}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Floor {room.floor}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge value={room.status}/>
                        {room.activeTask ? <StatusBadge value={room.activeTask.status}/> : null}
                      </div>
                    </div>))) : (<div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--muted-foreground)]">
                    No rooms in this column.
                  </div>)}
              </div>
            </Card>))}
        </div>

        <Card>
          <form className="space-y-4" onSubmit={submitIssue}>
            <div>
              <h2 className="text-xl font-semibold text-[var(--primary)]">Report maintenance issue</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Escalate room issues directly from housekeeping when a room cannot safely return to inventory.</p>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Room</span>
              <select className={inputClassName} value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                <option value="">Select room</option>
                {allRooms.map((room) => (<option key={room.id} value={room.id}>
                    Room {room.roomNumber}
                  </option>))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Issue type</span>
              <select className={inputClassName} value={issueType} onChange={(event) => setIssueType(event.target.value)}>
                {['ac', 'plumbing', 'electricity', 'furniture', 'lock', 'internet', 'bathroom', 'appliance', 'other'].map((type) => (<option key={type} value={type}>
                    {formatIssueType(type)}
                  </option>))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Priority</span>
              <select className={inputClassName} value={priority} onChange={(event) => setPriority(event.target.value)}>
                {['low', 'medium', 'high', 'urgent'].map((value) => (<option key={value} value={value}>
                    {value}
                  </option>))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--primary)]">Description</span>
              <textarea className={`${inputClassName} min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)}/>
            </label>
            <Button type="submit" disabled={createMaintenanceIssue.isPending || allRooms.length === 0}>
              {createMaintenanceIssue.isPending ? 'Reporting...' : 'Report issue'}
            </Button>
          </form>
        </Card>
      </div>
    </div>);
};
