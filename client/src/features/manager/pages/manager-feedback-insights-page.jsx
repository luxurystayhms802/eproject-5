import { useMemo, useState } from 'react';
import { MessageSquareQuote, Sparkles, Star, ThumbsUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { printManagementReportDocument } from '@/lib/print-documents';
import { ManagerReportToolbar } from '@/features/manager/components/manager-report-toolbar';
import { managerApi } from '@/features/manager/api';
import { useManagerFeedback } from '@/features/manager/hooks';
import { buildManagerReportParams, downloadManagerReportCsv, getManagerRangeLabel, validateManagerDateRange } from '@/features/manager/report-utils';

const getRatingValue = (distribution, labels) =>
  distribution
    .filter((item) => labels.includes(String(item.label)))
    .reduce((sum, item) => sum + Number(item.value ?? 0), 0);

export const ManagerFeedbackInsightsPage = () => {
  const [draftRange, setDraftRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [isExporting, setIsExporting] = useState(false);
  const queryParams = useMemo(() => buildManagerReportParams(appliedRange), [appliedRange]);
  const { data, isLoading } = useManagerFeedback(queryParams);
  const summary = data?.summary ?? {};
  const distribution = data?.distribution ?? [];
  const totalFeedback = Number(summary.totalFeedback ?? 0);
  const averageRating = Number(summary.averageRating ?? 0);
  const promoters = getRatingValue(distribution, ['4', '5']);
  const lowRatings = getRatingValue(distribution, ['1', '2']);

  const applyRange = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    setAppliedRange(draftRange);
    toast.success('Feedback insights updated.');
  };

  const resetRange = () => {
    setDraftRange({ from: '', to: '' });
    setAppliedRange({ from: '', to: '' });
  };

  const handleExport = async () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    try {
      setIsExporting(true);
      await downloadManagerReportCsv({ reportKey: 'feedback', range: draftRange, exportFn: managerApi.exportReportCsv, label: 'Feedback report' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const validationMessage = validateManagerDateRange(draftRange);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    printManagementReportDocument({
      brandLabel: 'LuxuryStay Manager',
      title: 'Guest Feedback Insights',
      subtitle: 'Post-stay sentiment and service quality signals for hotel-wide management review.',
      rangeLabel: getManagerRangeLabel(draftRange, 'Recent feedback window'),
      metrics: [
        { label: 'Feedback items', value: String(totalFeedback), helper: 'Reviews represented in manager analytics.' },
        { label: 'Average rating', value: `${averageRating.toFixed(2)}/5`, helper: 'Current guest sentiment average.' },
        { label: 'Promoters', value: String(promoters), helper: 'Positive 4-star and 5-star reviews.' },
        { label: 'Low ratings', value: String(lowRatings), helper: '1-star and 2-star reviews needing attention.' },
      ],
      sections: [
        {
          title: 'Rating distribution',
          rows: distribution.map((item) => ({
            label: `${item.label} star`,
            value: String(item.value),
            helper: 'Reviews recorded in this rating band.',
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Feedback Insights"
        description="Guest sentiment and review quality."
        action={
          <div className="flex flex-wrap gap-3">
            <Link to="/manager/revenue">
              <Button variant="secondary">Revenue context</Button>
            </Link>
            <Link to="/manager/notifications">
              <Button variant="outline">Open alerts</Button>
            </Link>
          </div>
        }
      >
        <StatusBadge value={averageRating >= 4 ? 'active' : averageRating >= 3 ? 'pending' : 'maintenance'} />
        <span className="inline-flex items-center rounded-full border border-[rgba(16,36,63,0.08)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Average {averageRating.toFixed(2)}/5
        </span>
      </PageHeader>

      <ManagerReportToolbar
        title="Feedback actions"
        description="Filter, export, or print."
        range={draftRange}
        onRangeChange={(field, value) => setDraftRange((current) => ({ ...current, [field]: value }))}
        onApply={applyRange}
        onReset={resetRange}
        onExport={handleExport}
        onPrint={handlePrint}
        isExporting={isExporting}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Feedback items" value={String(totalFeedback)} description="In range" icon={MessageSquareQuote} />
        <StatsCard title="Average rating" value={`${averageRating.toFixed(2)}/5`} description="Current" icon={Star} />
        <StatsCard title="Promoters" value={String(promoters)} description="4-5 star" icon={ThumbsUp} />
        <StatsCard title="Low ratings" value={String(lowRatings)} description="1-2 star" icon={Sparkles} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Rating distribution</h2>
            <p className="text-sm text-[var(--muted-foreground)]">A clear management view of how guest feedback is currently distributed.</p>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-[24px] bg-white/70" />
            ) : distribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10243f" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 text-sm text-[var(--muted-foreground)]">
                No guest feedback distribution data is available yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--primary)]">Service reading</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Interpret sentiment without leaving the manager dashboard stack.</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Current sentiment</p>
              <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">
                {averageRating >= 4 ? 'Strong guest sentiment' : averageRating >= 3 ? 'Stable with recovery opportunities' : 'Service recovery attention needed'}
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Positive share</p>
              <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{promoters}</p>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Low-rating watch</p>
              <p className="mt-3 text-2xl text-[var(--primary)] [font-family:var(--font-display)]">{lowRatings}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
