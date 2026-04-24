import { connectDatabase } from './src/config/db.js';
import { ReservationModel } from './src/modules/reservations/reservation.model.js';
import { getStartOfDay } from './src/shared/utils/reservations.js';
import { reservationService } from './src/modules/reservations/reservation.service.js';

async function run() {
  await connectDatabase();
  const todayMidnight = getStartOfDay(new Date());
  
  const overdueReservations = await ReservationModel.find({
      deletedAt: null,
      status: { $in: ['pending', 'confirmed'] },
      checkInDate: { $lt: todayMidnight }
  }).lean();
  
  console.log('Testing markAsMissedArrival for one of them...', overdueReservations[0]._id);
  try {
      const res = overdueReservations[0];
      await reservationService.markAsMissedArrival(res._id.toString(), { actorRole: 'system', request: null });
      console.log('Success!');
  } catch (err) {
      console.error('Error during markAsMissedArrival:', err.message);
      console.error(err.stack);
  }
  process.exit(0);
}
run().catch(console.error);
