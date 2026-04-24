import { connectDatabase } from './src/config/db.js';
import { ReservationModel } from './src/modules/reservations/reservation.model.js';
import { getStartOfDay } from './src/shared/utils/reservations.js';
import { reservationService } from './src/modules/reservations/reservation.service.js';

async function run() {
  await connectDatabase();
  
  const now = new Date();
  const auditBusinessDateStart = getStartOfDay(now);

  const overdueReservations = await ReservationModel.find({
      deletedAt: null,
      status: { $in: ['pending', 'confirmed'] },
      checkInDate: { $lte: auditBusinessDateStart }
  }).select('_id').lean();

  console.log('Found overdue reservations:', overdueReservations.length);
  const systemContext = { actorRole: 'system', request: null };
  for(const res of overdueReservations) {
      try {
          await reservationService.markAsMissedArrival(res._id.toString(), systemContext);
          console.log('Marked missed arrival for:', res._id);
      } catch (err) {
          console.log('Failed to mark:', res._id, err.message);
      }
  }
  process.exit(0);
}
run().catch(console.error);
