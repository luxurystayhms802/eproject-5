import { sendSuccess } from '../../shared/utils/api-response.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { auditService } from './audit.service.js';
export const auditController = {
    list: async (request, response) => {
        const result = await auditService.listLogs(request.query);
        return sendSuccess(response, {
            message: 'Audit logs fetched successfully',
            data: result.items,
            meta: buildPaginationMeta(result.pagination, result.total),
        });
    },
};
