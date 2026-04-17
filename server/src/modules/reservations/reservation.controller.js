import { sendSuccess } from '../../shared/utils/api-response.js';
import { reservationService } from './reservation.service.js';
export const reservationController = {
    list: async (request, response) => {
        const result = await reservationService.listReservations(request.query, {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Reservations fetched successfully',
            data: result.items,
            meta: result.meta,
        });
    },
    getById: async (request, response) => {
        const reservation = await reservationService.getReservationById(String(request.params.reservationId), {
            id: request.authUser.id,
            role: request.authUser.role,
        });
        return sendSuccess(response, {
            message: 'Reservation fetched successfully',
            data: reservation,
        });
    },
    create: async (request, response) => {
        const reservation = await reservationService.createReservation(request.body, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation created successfully',
            data: reservation,
            statusCode: 201,
        });
    },
    update: async (request, response) => {
        const reservation = await reservationService.updateReservation(String(request.params.reservationId), request.body, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation updated successfully',
            data: reservation,
        });
    },
    amendStay: async (request, response) => {
        const reservation = await reservationService.amendStayDates(String(request.params.reservationId), request.body, {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Stay dates amended successfully',
            data: reservation,
        });
    },
    confirm: async (request, response) => {
        const reservation = await reservationService.confirmReservation(String(request.params.reservationId), {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation confirmed successfully',
            data: reservation,
        });
    },
    assignRoom: async (request, response) => {
        const reservation = await reservationService.assignRoom(String(request.params.reservationId), request.body.roomId, {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Room assigned successfully',
            data: reservation,
        });
    },
    cancel: async (request, response) => {
        const reservation = await reservationService.cancelReservation(String(request.params.reservationId), request.body.cancellationReason, {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation cancelled successfully',
            data: reservation,
        });
    },
    markAsNoShow: async (request, response) => {
        const reservation = await reservationService.markAsNoShow(String(request.params.reservationId), {
            actorUserId: request.authUser.id,
            actorRole: request.authUser.role,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation marked as no-show successfully',
            data: reservation,
        });
    },
    checkIn: async (request, response) => {
        const reservation = await reservationService.checkInReservation(String(request.params.reservationId), request.body, {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation checked in successfully',
            data: reservation,
        });
    },
    checkOut: async (request, response) => {
        const result = await reservationService.checkOutReservation(String(request.params.reservationId), request.body, {
            actorUserId: request.authUser.id,
            request,
        });
        return sendSuccess(response, {
            message: 'Reservation checked out successfully',
            data: result,
        });
    },
};
