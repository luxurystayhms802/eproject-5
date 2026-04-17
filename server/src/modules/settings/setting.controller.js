import { sendSuccess } from '../../shared/utils/api-response.js';
import { settingService } from './setting.service.js';
import { cronService } from '../system/cron.service.js';

export const settingController = {
    getCurrent: async (_request, response) => {
        const settings = await settingService.getSettings();
        return sendSuccess(response, {
            message: 'Hotel settings fetched successfully',
            data: settings,
        });
    },
    updateCurrent: async (request, response) => {
        const settings = await settingService.updateSettings({
            ...request.body,
            updatedBy: request.authUser?.id ?? null,
        });

        if (request.body.nightAuditTime) {
            cronService.scheduleNightAudit(request.body.nightAuditTime);
        }

        return sendSuccess(response, {
            message: 'Hotel settings updated successfully',
            data: settings,
        });
    },
};
