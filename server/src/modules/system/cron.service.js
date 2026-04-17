import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { ReservationModel } from '../reservations/reservation.model.js';
import { reservationService } from '../reservations/reservation.service.js';
import { getStartOfDay } from '../../shared/utils/reservations.js';

let activeNightAuditTask = null;

export const cronService = {
    scheduleNightAudit(timeStr = '02:00') {
        const [hours, minutes] = (timeStr || '02:00').split(':');
        const cronExpression = `${parseInt(minutes, 10)} ${parseInt(hours, 10)} * * *`;

        if (activeNightAuditTask) {
            logger.info('Stopping existing night audit cron task to reschedule...');
            activeNightAuditTask.stop();
        }

        activeNightAuditTask = cron.schedule(cronExpression, async () => {
            logger.info(`Starting nightly audit job for no-shows (Scheduled for ${timeStr})...`);
            
            try {
                const todayMidnight = getStartOfDay(new Date());
                
                // Find pending or confirmed reservations whose checkInDate is strictly before today
                const overdueReservations = await ReservationModel.find({
                    deletedAt: null,
                    status: { $in: ['pending', 'confirmed'] },
                    checkInDate: { $lt: todayMidnight }
                }).select('_id').lean();

                if (overdueReservations.length === 0) {
                    logger.info('Night audit complete: No overdue arrivals found.');
                    return;
                }

                logger.info(`Night audit found ${overdueReservations.length} overdue arrivals. Processing...`);

                const systemContext = {
                    actorRole: 'system',
                    request: null
                };

                let processedCount = 0;
                for (const reservation of overdueReservations) {
                    try {
                        await reservationService.markAsNoShow(reservation._id.toString(), systemContext);
                        processedCount++;
                    } catch (error) {
                        logger.error({ err: error, reservationId: reservation._id }, 'Failed to mark reservation as no-show during night audit');
                    }
                }

                logger.info(`Night audit complete: Successfully marked ${processedCount}/${overdueReservations.length} reservations as no-show.`);
            } catch (error) {
                logger.error({ err: error }, 'Night audit job failed');
            }
        });

        logger.info(`Night audit cron job scheduled (Runs daily at ${timeStr}).`);
    }
};
