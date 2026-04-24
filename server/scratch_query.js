import { connectDatabase } from './src/config/db.js';
import { ReservationModel } from './src/modules/reservations/reservation.model.js';
import { SettingModel } from './src/modules/settings/setting.model.js';
import { getStartOfDay } from './src/shared/utils/reservations.js';

async function run() {
  await connectDatabase();
  const reservations = await ReservationModel.find({ status: { $in: ['pending', 'confirmed'] } }).lean();
  console.log('Pending/Confirmed reservations:', reservations.length);
  console.log(reservations.map(r => ({
    id: r._id,
    status: r.status,
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate
  })));

  const todayMidnight = getStartOfDay(new Date());
  console.log('Today Midnight:', todayMidnight);

  const overdueReservations = await ReservationModel.find({
      deletedAt: null,
      status: { $in: ['pending', 'confirmed'] },
      checkInDate: { $lt: todayMidnight }
  }).select('_id').lean();
  console.log('Overdue reservations that cron would pick:', overdueReservations.length);

  const settings = await SettingModel.findOne().sort({ createdAt: -1 }).lean();
  console.log('Settings nightAuditTime:', settings?.nightAuditTime);

  process.exit(0);
}
run().catch(console.error);
