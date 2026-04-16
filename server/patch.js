import { connectDatabase } from './src/config/db.js';
import { RoleModel } from './src/modules/roles/role.model.js';

async function run() {
  await connectDatabase();
  const res = await RoleModel.updateOne({ name: 'guest' }, { $addToSet: { permissions: 'folioCharges.read' } });
  console.log('Updated guest permissions', res);
  process.exit(0);
}
run();
