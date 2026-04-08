import { app } from './app.js';
import { env } from '../config/env.js';
import { connectDatabase } from '../config/db.js';
import { logger } from '../config/logger.js';
import { roleService } from '../modules/roles/role.service.js';
const startServer = async () => {
    await connectDatabase();
    await roleService.ensureSystemRoles();
    app.listen(env.PORT, () => {
        logger.info(`LuxuryStay API listening on port ${env.PORT}`);
    });
};
startServer().catch((error) => {
    logger.error(error);
    process.exit(1);
});
