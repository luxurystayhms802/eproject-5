import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, ExternalLink, Mail, MapPin, Phone, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicPageHero } from '@/features/public/components/public-page-hero';
import { PublicSectionHeading } from '@/features/public/components/public-section-heading';
import { useHotelSettings, useRoomTypes, useSubmitInquiry } from '@/features/public/hooks';
import { contactInquirySchema } from '@/features/public/schemas';
import { getPrimaryImage, getPublicBranding } from '@/features/public/utils';

export const ContactPage = () => {
  const submitInquiry = useSubmitInquiry();
  const settingsQuery = useHotelSettings();
  const roomTypesQuery = useRoomTypes({ isActive: true, limit: 12 });
  const branding = getPublicBranding(settingsQuery.data);
  const websiteMedia = branding.websiteMedia || {};
  const roomTypes = roomTypesQuery.data?.data ?? [];
  const socialEntries = Object.entries(branding.socialLinks || {}).filter(([, value]) => Boolean(value));
  
  const contactHighlights = [
    { label: 'Response window', value: 'Same day' },
    { label: 'Arrival support', value: branding.checkInTime },
    { label: 'Guest channel', value: branding.contactEmail },
  ];

  const form = useForm({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  return (
    <div className="pb-8 pt-4">
      <div className="space-y-16 md:space-y-24">
        <section className="px-4 md:px-6">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[40px] bg-[var(--primary)] text-white shadow-2xl relative">
          {/* Main Background Image - Now at full opacity and properly placed */}
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${websiteMedia.contactImageUrl || websiteMedia.destinationImageUrl || getPrimaryImage(roomTypes[2] || roomTypes[0])})` }} 
          />
          {/* Refined gradient overlay for a richer, more polished transition */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--primary)_0%,rgba(16,36,63,0.95)_45%,rgba(16,36,63,0)_100%)]" />
          
          <div className="relative z-10 grid lg:grid-cols-[1.1fr,0.9fr] min-h-[460px] lg:min-h-[520px]">
            <div className="flex flex-col justify-center h-full px-6 py-16 md:px-12 xl:pl-16">
              <span className="mb-4 md:mb-5 inline-flex w-fit items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] drop-shadow-md">
                <span className="h-px w-6 bg-[var(--accent)]" />
                Contact & Inquiries
              </span>
              <h1 className="font-[var(--font-display)] text-4xl leading-[1.1] text-white md:text-5xl lg:text-[4.2rem] drop-shadow-lg">
                Begin with an inquiry or private request.
              </h1>
              <p className="mt-5 max-w-lg text-base md:text-lg leading-relaxed text-white/80 drop-shadow">
                Whether you are planning a stay, arranging an event, or confirming an arrival, the contact experience should feel clear and seamlessly premium.
              </p>

              <div className="mt-10 md:mt-14 flex flex-wrap gap-6 border-t border-white/10 pt-8 opacity-90">
                <div className="flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-white/90">Same-day response</p>
                </div>
                <div className="flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-white/90">Direct desk access</p>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block relative h-full">
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)] via-transparent to-transparent lg:hidden" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 mt-8">
        <div className="mx-auto flex flex-col md:flex-row max-w-[1380px] rounded-[40px] overflow-hidden bg-white shadow-[0_20px_50px_rgba(16,36,63,0.06)] border border-[var(--border)]">
          
          {/* Left Column: Dark Premium Contact Card */}
          <div className="relative w-full md:w-[40%] xl:w-[35%] shrink-0 bg-[linear-gradient(145deg,#091220,#132540)] p-10 md:p-14 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <MessageSquare className="w-64 h-64" />
            </div>

            <div className="relative z-10">
              <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f3d7aa]">
                Reach us directly
              </span>
              <h2 className="mt-6 font-[var(--font-display)] text-4xl leading-tight text-white mb-8">
                Connect with our reservations team.
              </h2>

              <div className="space-y-6">
                <div className="rounded-[24px] border border-white/12 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#f3d7aa]">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Direct Line</p>
                      <a href={`tel:${branding.contactPhone}`} className="mt-1 block text-lg font-medium text-white hover:text-[#f3d7aa] transition-colors">
                        {branding.contactPhone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#f3d7aa]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Email inquiries</p>
                      <a href={`mailto:${branding.contactEmail}`} className="mt-1 block text-lg font-medium text-white hover:text-[#f3d7aa] transition-colors">
                        {branding.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f3d7aa]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Location</p>
                      <p className="mt-1 text-base leading-relaxed text-white/90">
                        {branding.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/12 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f3d7aa]">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Stay Rhythm</p>
                      <p className="mt-1 text-base leading-relaxed text-white/90">
                        Check-in at {branding.checkInTime} <br />
                        Check-out at {branding.checkOutTime}
                      </p>
                    </div>
                  </div>
                </div>

                {socialEntries.length > 0 && (
                 <div className="pt-4 mt-8 border-t border-white/10">
                   <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-4">Connect Socially</p>
                   <div className="flex flex-wrap gap-3">
                     {socialEntries.map(([label, value]) => (
                       <a
                         key={label}
                         href={value}
                         target="_blank"
                         rel="noreferrer"
                         className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition hover:bg-[#f3d7aa] hover:text-black hover:border-[#f3d7aa]"
                       >
                         {label}
                         <ExternalLink className="h-3 w-3" />
                       </a>
                     ))}
                   </div>
                 </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Light Inquiry Form */}
          <div className="w-full flex-1 p-10 md:p-14 lg:p-16">
            <div className="max-w-[500px] mb-10">
              <span className="inline-flex rounded-full border border-[rgba(184,140,74,0.22)] bg-[var(--accent-soft)]/65 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
                Send a Message
              </span>
              <h3 className="mt-5 font-[var(--font-display)] text-4xl leading-tight text-[var(--primary)] text-balance">
                Share your plans or special requests.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Fill out the form below to send a direct message to our front desk. We aim to reply to all inquiries on the same day.
              </p>
            </div>

            <form
              className="grid gap-6 md:grid-cols-2"
              onSubmit={form.handleSubmit((values) => {
                submitInquiry.mutate(values, {
                  onSuccess: () => {
                    form.reset();
                    toast.success("Your inquiry has been sent successfully. We will get back to you shortly.");
                  },
                });
              })}
            >
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] ml-2">Full name</label>
                <input 
                  id="contact-full-name" 
                  placeholder="Your full name" 
                  className="w-full rounded-[20px] bg-[var(--accent-soft)] px-5 py-4 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/60" 
                  {...form.register('fullName')} 
                  onInput={(e) => {
                    const cleanVal = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                    e.target.value = cleanVal;
                    form.setValue('fullName', cleanVal, { shouldValidate: true });
                  }} 
                />
                <p className="text-xs text-rose-600 pl-2">{form.formState.errors.fullName?.message}</p>
              </div>
              
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] ml-2">Phone</label>
                <input 
                  id="contact-phone" 
                  placeholder="03001234567" 
                  maxLength={11} 
                  autoComplete="off"
                  className="w-full rounded-[20px] bg-[var(--accent-soft)] px-5 py-4 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/60" 
                  {...form.register('phone')} 
                  onInput={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    e.target.value = cleanVal;
                    form.setValue('phone', cleanVal, { shouldValidate: true });
                  }} 
                />
                <p className="text-xs text-rose-600 pl-2">{form.formState.errors.phone?.message}</p>
              </div>
              
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] ml-2">Email address</label>
                <input id="contact-email" type="email" autoComplete="off" placeholder="you@example.com" className="w-full rounded-[20px] bg-[var(--accent-soft)] px-5 py-4 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/60" {...form.register('email')} />
                <p className="text-xs text-rose-600 pl-2">{form.formState.errors.email?.message}</p>
              </div>
              
              <div className="space-y-2.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)] ml-2">How can we help?</label>
                <textarea rows={6} id="contact-message" placeholder="Please describe your inquiry, event plans, or reservation request in detail..." className="w-full rounded-[20px] bg-[var(--accent-soft)] px-5 py-4 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all placeholder:text-[var(--muted-foreground)]/60 resize-none" {...form.register('message')} />
                <p className="text-xs text-rose-600 pl-2">{form.formState.errors.message?.message}</p>
              </div>

              <div className="md:col-span-2 mt-4 pt-6 border-t border-[var(--border)]">
                <Button 
                  type="submit" 
                  variant="secondary" 
                  className="w-full rounded-full py-7 text-base font-bold tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2" 
                  disabled={submitInquiry.isPending}
                >
                  {submitInquiry.isPending ? 'Sending...' : (
                    <>
                      Send Inquiry <Send className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] font-medium text-[var(--muted-foreground)] mt-4">
                   Your trust is our priority. We never share your personal information.
                </p>
              </div>
              </form>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 md:mt-12 px-4 md:px-6">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[32px] border border-white/55 shadow-2xl">
          {branding.mapEmbedUrl ? (
            <div className="group h-[500px] w-full">
              <iframe
                title={`${branding.hotelName} location map`}
                src={branding.mapEmbedUrl}
                className="h-full w-full border-0 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none group-hover:pointer-events-auto"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="flex min-h-[500px] items-end bg-[linear-gradient(145deg,#10243f,#18355d,#c1924c)] p-10 text-white relative">
              <div className="max-w-xl rounded-[32px] border border-white/14 bg-white/10 p-8 backdrop-blur-md relative z-10 shadow-2xl transform translate-y-4 hover:translate-y-0 transition-transform">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f3d7aa]">Map placeholder</p>
                <h3 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-white mb-2">Add a location map to complete the arrival story.</h3>
                <p className="text-sm text-white/70">Configure your mapEmbedUrl in the settings to display a live city view.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

