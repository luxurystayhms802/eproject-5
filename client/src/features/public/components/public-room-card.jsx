import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, Ruler, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, getPrimaryImage } from '@/features/public/utils';

export const PublicRoomCard = ({
  room,
  currency = 'PKR',
  checkInDate = '',
  checkOutDate = '',
  adults = 2,
  children = 0,
  align = 'vertical',
  valueLabel = '/ night',
}) => {
  const roomImage = getPrimaryImage(room);
  const displayedValue = room.pricing?.ratePerNight ?? room.basePrice;
  const roomRouteId = room.slug || room.id;
  const detailsUrl = `/rooms/${roomRouteId}?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&children=${children}`;

  const navigate = useNavigate();

  return (
    <article 
      onClick={() => navigate(detailsUrl)} 
      className={`group flex flex-col cursor-pointer transition-colors hover:bg-[#fbf9f6]/30 rounded-[32px] ${align === 'horizontal' ? 'lg:flex-row lg:items-center gap-10 lg:gap-20 py-8 lg:py-12 border-b border-black/[0.06] last:border-0' : 'gap-8 mb-16'}`}
    >
      
      {/* 📸 Image Section (Standalone, Clean Crop) */}
      <div className={`relative overflow-hidden w-full ${align === 'horizontal' ? 'lg:w-[48%]' : ''}`}>
        <div className="relative aspect-[4/3.2] w-full rounded-2xl overflow-hidden bg-[#fbf9f6] isolate">
          {roomImage ? (
            <img 
              src={roomImage} 
              alt={room.name} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.25,1)] group-hover:scale-[1.04]" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="font-[var(--font-display)] text-2xl text-black/20">No Image</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700 pointer-events-none" />
          
          {room.featured && (
            <div className="absolute top-5 left-5 inline-flex rounded-full bg-white/90 backdrop-blur px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#0c1622] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
              Signature Suite
            </div>
          )}
        </div>
      </div>

      {/* 🖋 Text Details Section (Airy, Minimalist) */}
      <div className={`flex flex-col w-full ${align === 'horizontal' ? 'lg:w-[52%]' : ''}`}>
        <div className="mb-6 lg:mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#c5a059] mb-4">
            {room.bedType} Collection
          </p>
          
          <h3 className="font-[var(--font-display)] text-[2.4rem] sm:text-[3rem] lg:text-[3.5rem] leading-[1.05] tracking-tight text-[#0c1622] mb-5">
            {room.name}
          </h3>
          
          <p className="text-[1rem] leading-[1.85] text-[#556375] font-light max-w-[45ch]">
            {room.shortDescription || 'A refined stay with warm interiors, elegantly tailored space, and an uncompromising atmosphere of quiet luxury.'}
          </p>
        </div>

        {/* Inline Specs */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[14.5px] border-y border-black/[0.04] py-5">
          <span className="flex items-center gap-3 text-[#556375]">
            <Users className="h-4 w-4 text-[#c5a059] opacity-80" />
            <span className="font-light">Up to <strong className="font-medium text-[#0c1622]">{room.maxAdults} Adults</strong></span>
          </span>
          <span className="flex items-center gap-3 text-[#556375]">
            <BedDouble className="h-4 w-4 text-[#c5a059] opacity-80" />
            <span className="font-light"><strong className="font-medium text-[#0c1622]">{room.bedType}</strong> Bed</span>
          </span>
          {room.roomSizeSqFt && (
            <span className="flex items-center gap-3 text-[#556375]">
              <Ruler className="h-4 w-4 text-[#c5a059] opacity-80" />
              <span className="font-light"><strong className="font-medium text-[#0c1622]">{room.roomSizeSqFt}</strong> ft²</span>
            </span>
          )}
        </div>

        {/* Amenities as elegant dot-separated list */}
        <div className="mt-5 mb-10 lg:mb-12">
          <p className="text-[12.5px] font-medium tracking-[0.08em] uppercase text-[#8896a6] leading-relaxed">
            {(room.amenities ?? []).slice(0, 6).join('  ·  ')}
            {(room.amenities?.length ?? 0) > 6 && `  ·  +${room.amenities.length - 6} More`}
          </p>
        </div>

        {/* 💳 Footer: Pricing & Actions */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-8 sm:gap-6">
          <div>
            <p className="text-[9.5px] font-black uppercase tracking-[0.25em] text-[#8896a6] mb-1.5 bg-clip-text text-transparent bg-gradient-to-r from-[#8896a6] to-[#b3bed0]">
              Starting Rate
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-[var(--font-display)] text-[2.4rem] lg:text-[2.8rem] tracking-tight text-[#0c1622] leading-[0.9]">
                {formatCurrency(displayedValue, currency)}
              </span>
              <span className="text-[13px] text-[#8896a6] font-medium uppercase tracking-widest">{valueLabel}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to={detailsUrl} className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="w-full rounded-full h-[3.4rem] px-8 text-[#0c1622] hover:bg-[#fbf9f6] text-[11px] font-bold tracking-[0.15em] uppercase hover:text-[#c5a059] transition-colors pointer-events-none">
                View Details
              </Button>
            </Link>
            <Link to={`/booking?roomTypeId=${room.id}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=${adults}&children=${children}`} className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
              <Button className="w-full rounded-full h-[3.4rem] px-10 bg-[#0c1622] text-[#ecd3a8] hover:bg-[#152336] shadow-xl hover:shadow-2xl hover:-translate-y-1 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-300 border-none">
                Reserve
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

