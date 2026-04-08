import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { swaggerSpec } from '../config/swagger.js';
import { auditRouter } from '../modules/audit/audit.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { folioChargesRouter, invoicesRouter, paymentsRouter } from '../modules/billing/billing.routes.js';
import { feedbackRouter } from '../modules/feedback/feedback.routes.js';
import { departmentsRouter } from '../modules/departments/department.routes.js';
import { guestsRouter } from '../modules/guests/guest-profile.routes.js';
import { housekeepingRouter } from '../modules/housekeeping/housekeeping.routes.js';
import { maintenanceRouter } from '../modules/maintenance/maintenance-request.routes.js';
import { notificationsRouter } from '../modules/notifications/notification.routes.js';
import { reportsRouter } from '../modules/reports/reports.routes.js';
import { rolesRouter } from '../modules/roles/role.routes.js';
import { reservationsRouter } from '../modules/reservations/reservation.routes.js';
import { roomTypesRouter } from '../modules/room-types/room-type.routes.js';
import { roomsRouter } from '../modules/rooms/room.routes.js';
import { serviceRequestsRouter } from '../modules/services/service-request.routes.js';
import { settingsRouter } from '../modules/settings/setting.routes.js';
import { inquiriesRouter } from '../modules/inquiries/inquiry.routes.js';
import { staffRouter } from '../modules/staff/staff-profile.routes.js';
import { uploadsRouter } from '../modules/uploads/upload.routes.js';
import { faqsRouter } from '../modules/faqs/faq.routes.js';
import { usersRouter } from '../modules/users/user.routes.js';
import { errorHandler } from '../shared/middleware/error-handler.js';
import { notFoundHandler } from '../shared/middleware/not-found.js';
export const app = express();
const httpLogger = pinoHttp({
    logger,
    quietReqLogger: true,
    autoLogging: {
        ignore: (request) => request.url === '/health',
    },
    customLogLevel: (request, response, error) => {
        if (request.readableAborted || !response.writableEnded) {
            return 'silent';
        }
        if (error || response.statusCode >= 500) {
            return 'error';
        }
        if (response.statusCode >= 400) {
            return 'warn';
        }
        if (response.statusCode >= 300) {
            return 'silent';
        }
        return 'info';
    },
    customSuccessMessage: (request, response) => `${request.method} ${request.url} -> ${response.statusCode}`,
    customErrorMessage: (request, response, error) => `${request.method} ${request.url} failed: ${error?.message ?? `status ${response.statusCode}`}`,
});
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 250 }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(httpLogger);
app.get('/health', (_request, response) => {
    response.json({ success: true, message: 'LuxuryStay API is healthy' });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/guests', guestsRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/departments', departmentsRouter);
app.use('/api/v1/room-types', roomTypesRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/reservations', reservationsRouter);
app.use('/api/v1/folio-charges', folioChargesRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/housekeeping', housekeepingRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/service-requests', serviceRequestsRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/inquiries', inquiriesRouter);
app.use('/api/v1/audit-logs', auditRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/faqs', faqsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
