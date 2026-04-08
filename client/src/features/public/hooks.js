import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { publicApi } from '@/features/public/api';
export const publicQueryKeys = {
    hotelSettings: ['hotel-settings'],
    publishedFeedback: (params) => ['published-feedback', params],
    roomTypes: (params) => ['room-types', params],
    rooms: (params) => ['rooms', params],
    roomType: (roomTypeId) => ['room-type', roomTypeId],
    availability: (params) => ['availability', params],
    guestReservations: ['guest-reservations'],
    faqs: ['faqs'],
};
export const useHotelSettings = () => useQuery({
    queryKey: publicQueryKeys.hotelSettings,
    queryFn: publicApi.getSettings,
});
export const usePublishedFeedback = (params) => useQuery({
    queryKey: publicQueryKeys.publishedFeedback(params),
    queryFn: () => publicApi.listPublishedFeedback(params),
});
export const useRoomTypes = (params) => useQuery({
    queryKey: publicQueryKeys.roomTypes(params),
    queryFn: () => publicApi.listRoomTypes(params),
});
export const useRooms = (params) => useQuery({
    queryKey: publicQueryKeys.rooms(params),
    queryFn: () => publicApi.listRooms(params),
});
export const useRoomType = (roomTypeId) => useQuery({
    queryKey: publicQueryKeys.roomType(roomTypeId),
    queryFn: () => publicApi.getRoomType(roomTypeId),
    enabled: Boolean(roomTypeId),
});
export const useAvailabilitySearch = (params) => useQuery({
    queryKey: publicQueryKeys.availability(params ?? {
        checkInDate: '',
        checkOutDate: '',
        adults: 1,
        children: 0,
    }),
    queryFn: () => publicApi.searchAvailability(params),
    enabled: Boolean(params?.checkInDate && params?.checkOutDate),
});
export const useCreateReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => publicApi.createReservation(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: publicQueryKeys.guestReservations });
            toast.success('Reservation created successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create reservation.'));
        },
    });
};
export const useGuestReservations = () => useQuery({
    queryKey: publicQueryKeys.guestReservations,
    queryFn: publicApi.listGuestReservations,
});
export const useSubmitInquiry = () => {
    return useMutation({
        mutationFn: (payload) => publicApi.submitInquiry(payload),
        onSuccess: () => {
            toast.success('Your inquiry has been submitted successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to submit inquiry.'));
        },
    });
};
export const useFaqs = () => useQuery({
    queryKey: publicQueryKeys.faqs,
    queryFn: publicApi.listFaqs,
});
