import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { ReservationModel } from '../reservations/reservation.model.js';
import { reservationService } from '../reservations/reservation.service.js';
import { SettingModel } from '../settings/setting.model.js';
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
            logger.info(`Starting nightly audit job for missed arrivals (Scheduled for ${timeStr})...`);
            
            try {
                const now = new Date();
                const currentHour = now.getHours();

                // Determine the business date being audited
                // If running in the morning (e.g., 01:00 to 11:59), we are auditing yesterday's check-ins
                // If running in the afternoon/evening (e.g., 12:00 to 23:59), we are auditing today's check-ins
                const auditBusinessDate = new Date(now);
                if (currentHour < 12) {
                    auditBusinessDate.setDate(auditBusinessDate.getDate() - 1);
                }
                const auditBusinessDateStart = getStartOfDay(auditBusinessDate);
                
                // Find pending or confirmed reservations whose checkInDate is on or before the audit business date
                const overdueReservations = await ReservationModel.find({
                    deletedAt: null,
                    status: { $in: ['pending', 'confirmed'] },
                    checkInDate: { $lte: auditBusinessDateStart }
                }).select('_id').lean();

                const systemContext = {
                    actorRole: 'system',
                    request: null
                };

                // Section 1: Handle Missed Arrivals
                let missedCount = 0;
                if (overdueReservations.length > 0) {
                    logger.info(`Night audit found ${overdueReservations.length} overdue arrivals. Processing...`);
                    for (const reservation of overdueReservations) {
                        try {
                            await reservationService.markAsMissedArrival(reservation._id.toString(), systemContext);
                            missedCount++;
                        } catch (error) {
                            logger.error({ err: error, reservationId: reservation._id }, 'Failed to mark reservation as missed arrival during night audit');
                        }
                    }
                    logger.info(`Night audit: Successfully marked ${missedCount}/${overdueReservations.length} reservations as missed arrival.`);
                } else {
                    logger.info('Night audit: No overdue arrivals found.');
                }

                // Section 2: Handle Overstays
                const settings = await SettingModel.findOne().sort({ createdAt: -1 }).lean();
                if (settings?.nightAuditSettings?.enableAutoExtendOverstay) {
                    logger.info('Night audit: Processing auto-extend for overstays based on hotel settings...');
                    const overstayCount = await reservationService.handleOverstays(settings, systemContext);
                    logger.info(`Night audit: Successfully auto-extended and charged ${overstayCount} overstay reservations.`);
                } else {
                    logger.info('Night audit: Overstay auto-extend is disabled in hotel settings.');
                }

                logger.info('Night audit job completed successfully.');
            } catch (error) {
                logger.error({ err: error }, 'Night audit job failed');
            }
        });

        logger.info(`Night audit cron job scheduled (Runs daily at ${timeStr}).`);
    }
};
