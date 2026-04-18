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
    const sortedRooms = useMemo(() => {
        return [...allRooms].sort((a, b) => {
            const numA = parseInt(a.roomNumber.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.roomNumber.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
    }, [allRooms]);

    const [roomId, setRoomId] = useState('');
    const [issueType, setIssueType] = useState('ac');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');

    const getRoomStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'dirty') return 'border-rose-400 bg-rose-50/60 text-rose-950';
        if (s === 'clean') return 'border-emerald-400 bg-emerald-50/60 text-emerald-950';
        if (s === 'in_progress') return 'border-amber-400 bg-amber-50/60 text-amber-950';
        if (s === 'inspected') return 'border-cyan-400 bg-cyan-50/60 text-cyan-950';
        return 'border-[var(--border)] bg-white/70 text-[var(--primary)]';
    };

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

    return (
      <div className="space-y-6">
        <PageHeader title="Room Cleaning Board" description="Visual room matrix layout showing housekeeping states of all rooms instantly without scrolling."/>

        <div className="space-y-8">
          
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/40 px-5 py-3 border border-white/60">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Legend:</span>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-400" /> <span className="text-sm font-medium">Clean</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-cyan-400" /> <span className="text-sm font-medium">Inspected</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-400" /> <span className="text-sm font-medium">In Progress</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-rose-400" /> <span className="text-sm font-medium">Dirty</span></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
            {isLoading ? (
              <div className="col-span-full h-32 animate-pulse rounded-[22px] bg-white/70" />
            ) : sortedRooms.length > 0 ? (
              sortedRooms.map(room => (
                <div key={room.id} className={`flex flex-col justify-center items-center rounded-2xl border-l-[6px] border-r border-y p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ${getRoomStyle(room.housekeepingStatus)}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Room</p>
                  <p className="text-3xl font-bold leading-none [font-family:var(--font-display)]">{room.roomNumber}</p>
                  <div className="mt-4 flex flex-col items-center gap-1.5 w-full">
                    <span className="w-full text-center text-[10px] font-bold uppercase tracking-widest opacity-90 pb-1.5 border-b border-black/10">{room.housekeepingStatus.replaceAll('_', ' ')}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">{room.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-8 text-center text-sm text-[var(--muted-foreground)]">
                No rooms available to display in matrix.
              </div>
            )}
          </div>

          <Card className="max-w-3xl">
            <form className="space-y-4" onSubmit={submitIssue}>
              <div>
                <h2 className="text-xl font-semibold text-[var(--primary)]">Report maintenance issue</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Escalate room issues directly from housekeeping when a room cannot safely return to inventory.</p>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--primary)]">Room</span>
                <select className={inputClassName} value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                  <option value="">Select room</option>
                  {sortedRooms.map((room) => (<option key={room.id} value={room.id}>
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
              <Button type="submit" disabled={createMaintenanceIssue.isPending || sortedRooms.length === 0}>
                {createMaintenanceIssue.isPending ? 'Reporting...' : 'Report issue'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
};

