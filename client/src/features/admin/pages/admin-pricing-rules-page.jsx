import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Landmark, Plus, TimerReset, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminToolbar } from '@/features/admin/components/admin-toolbar';
import {
  adminInputClassName,
  adminLabelClassName,
  adminLabelTextClassName,
  formatAdminCurrency,
} from '@/features/admin/config';
import { validatePricingRulesForm } from '@/features/admin/form-utils';
import { useAdminSettings, useUpdateAdminSettings } from '@/features/admin/hooks';
import { buildSettingsPayload, createDefaultSettingsForm, mergeSettingsForm } from '@/features/admin/settings-utils';

const createTaxRule = () => ({
  name: '',
  percentage: 0,
  appliesTo: 'room_nights',
});

export const AdminPricingRulesPage = () => {
  const settingsQuery = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [form, setForm] = useState(createDefaultSettingsForm());

  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const isAdmin = user?.role === 'admin';
  const canUpdate = isAdmin || permissions.includes('settings.update');

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(mergeSettingsForm(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  const summary = useMemo(() => {
    const primaryTax = Number(form.taxRules?.[0]?.percentage ?? 0);
    const totalTax = (form.taxRules ?? []).reduce((sum, rule) => sum + Number(rule.percentage ?? 0), 0);
    return {
      primaryTax,
      totalTax,
      taxRules: form.taxRules?.length ?? 0,
      currency: form.currency,
    };
  }, [form]);

  const updateTaxRule = (index, patch) => {
    setForm((current) => ({
      ...current,
      taxRules: current.taxRules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)),
    }));
  };

  const addTaxRule = () => {
    setForm((current) => ({
      ...current,
      taxRules: [...(current.taxRules ?? []), createTaxRule()],
    }));
  };

  const removeTaxRule = (index) => {
    setForm((current) => ({
      ...current,
      taxRules: current.taxRules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationMessage = validatePricingRulesForm(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    updateSettings.mutate(buildSettingsPayload(form));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax & Pricing Rules"
        description="Control fiscal defaults, invoice tax rules, and front-desk stay timing from a dedicated pricing governance module."
        action={
          canUpdate ? (
            <Button type="submit" form="pricing-rules-form" variant="secondary" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save pricing rules'}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Primary tax" value={`${summary.primaryTax}%`} description="Leading tax rule used most often in invoice generation." icon={Landmark} />
        <StatsCard title="Total tax stack" value={`${summary.totalTax}%`} description="Combined tax percentages currently configured across active rules." icon={DollarSign} />
        <StatsCard title="Tax rules" value={String(summary.taxRules)} description="Individual pricing rules stored in the hotel settings record." icon={Plus} />
        <StatsCard title="Currency" value={summary.currency} description="Current system currency used in billing and payment displays." icon={TimerReset} />
      </div>

      <form id="pricing-rules-form" className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]" onSubmit={handleSubmit}>
        <Card className="space-y-5">
          <div>
            <h2 className="text-[28px] text-[var(--primary)] [font-family:var(--font-display)]">Stay timing & currency</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Set defaults that directly affect check-in/out operations and billing presentation.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Timezone</span>
              <input className={adminInputClassName} value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Check-in time</span>
              <input className={adminInputClassName} value={form.checkInTime} onChange={(event) => setForm((current) => ({ ...current, checkInTime: event.target.value }))} />
            </label>
            <label className={adminLabelClassName}>
              <span className={adminLabelTextClassName}>Check-out time</span>
              <input className={adminInputClassName} value={form.checkOutTime} onChange={(event) => setForm((current) => ({ ...current, checkOutTime: event.target.value }))} />
            </label>
          </div>
        </Card>

        <Card className="space-y-5">
          <AdminToolbar
            title="Tax rules"
            description="Add, edit, or remove individual hotel tax rules that feed invoice and billing calculations."
            actions={
              canUpdate ? (
                <Button type="button" variant="outline" className="rounded-2xl px-4" onClick={addTaxRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add rule
                </Button>
              ) : null
            }
          />

          <div className="space-y-4">
            {(form.taxRules ?? []).map((rule, index) => (
              <div key={`${rule.name}-${index}`} className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
                <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_1fr_auto]">
                  <label className={adminLabelClassName}>
                    <span className={adminLabelTextClassName}>Rule name</span>
                    <input
                      className={adminInputClassName}
                      value={rule.name}
                      onChange={(event) => updateTaxRule(index, { name: event.target.value })}
                    />
                  </label>

                  <label className={adminLabelClassName}>
                    <span className={adminLabelTextClassName}>Percentage</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={adminInputClassName}
                      value={rule.percentage}
                      onChange={(event) => updateTaxRule(index, { percentage: Number(event.target.value) })}
                    />
                  </label>

                  <label className={adminLabelClassName}>
                    <span className={adminLabelTextClassName}>Applies to</span>
                    <input
                      className={adminInputClassName}
                      value={rule.appliesTo}
                      onChange={(event) => updateTaxRule(index, { appliesTo: event.target.value })}
                    />
                  </label>

                  <div className="flex items-end">
                    {canUpdate && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl px-4 text-rose-700"
                        onClick={() => removeTaxRule(index)}
                        disabled={(form.taxRules ?? []).length <= 1}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[20px] border border-[var(--border)] bg-white/78 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Billing preview note</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Invoices and payments in the admin desk will keep showing values in {summary.currency}, and room-night charges will apply the configured tax stack during generation and finalization.
            </p>
            <p className="mt-3 font-semibold text-[var(--primary)]">Illustrative tax on 1,000.00 = {formatAdminCurrency((summary.totalTax / 100) * 1000)}</p>
          </div>
        </Card>
      </form>
    </div>
  );
};
