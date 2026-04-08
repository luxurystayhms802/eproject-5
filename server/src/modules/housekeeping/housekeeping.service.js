import { MaintenanceRequestModel } from '../maintenance/maintenance-request.model.js';
import { RoomModel } from '../rooms/room.model.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notification.service.js';
import { AppError } from '../../shared/utils/app-error.js';
import { buildPaginationMeta, getPagination } from '../../shared/utils/pagination.js';
import { housekeepingRepository } from './housekeeping.repository.js';
const getEntityId = (value) => {
    if (!value) {
        return null;
    }
    if (typeof value === 'object' && '_id' in value) {
        const nested = value._id;
        if (nested && typeof nested === 'object' && 'toString' in nested) {
            return nested.toString();
        }
    }
    if (typeof value === 'object' && 'toString' in value) {
        return value.toString();
    }
    return String(value);
};
const serializeTask = (task) => ({
    id: task._id.toString(),
    roomId: getEntityId(task.roomId),
    room: task.roomId,
    reservationId: getEntityId(task.reservationId),
    reservation: task.reservationId ?? null,
    taskType: task.taskType,
    assignedToUserId: getEntityId(task.assignedToUserId),
    assignedTo: task.assignedToUserId ?? null,
    priority: task.priority,
    status: task.status,
    scheduledFor: task.scheduledFor ?? null,
    startedAt: task.startedAt ?? null,
    completedAt: task.completedAt ?? null,
    notes: task.notes ?? null,
    createdAt: task.createdAt ?? null,
    updatedAt: task.updatedAt ?? null,
});
export const housekeepingService = {
    async createCheckoutCleaningTask(payload, context) {
        const task = await housekeepingRepository.createTask({
            roomId: payload.roomId,
            reservationId: payload.reservationId,
            taskType: 'checkout_cleaning',
            priority: 'high',
            status: 'pending',
            scheduledFor: payload.scheduledFor ?? new Date(),
            notes: payload.notes ?? 'Auto-created after guest checkout',
        });
        const createdTask = await housekeepingRepository.findTaskById(task._id.toString());
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'housekeeping.create',
            entityType: 'housekeeping_task',
            entityId: task._id.toString(),
            after: serializeTask(createdTask.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'housekeeping',
            title: 'Checkout cleaning task created',
            message: 'A room has entered post-checkout cleaning and is waiting for housekeeping.',
            targetRoles: ['housekeeping'],
            link: '/housekeeping/tasks',
            priority: 'high',
        });
        return serializeTask(createdTask.toObject());
    },
    async listTasks(query, actor) {
        const pagination = getPagination(query);
        const filter = { deletedAt: null };
        if (query.status)
            filter.status = query.status;
        if (query.taskType)
            filter.taskType = query.taskType;
        if (query.priority)
            filter.priority = query.priority;
        if (query.reservationId)
            filter.reservationId = query.reservationId;
        if (query.roomId)
            filter.roomId = query.roomId;
        if (actor.role === 'housekeeping') {
            filter.$or = [{ assignedToUserId: actor.id }, { assignedToUserId: null }];
        }
        else if (query.assignedToUserId) {
            filter.assignedToUserId = query.assignedToUserId;
        }
        const [items, total] = await Promise.all([
            housekeepingRepository.listTasks(filter, pagination.skip, pagination.limit),
            housekeepingRepository.countTasks(filter),
        ]);
        return {
            items: items.map((item) => serializeTask(item)),
            meta: buildPaginationMeta(pagination, total),
        };
    },
    async getTaskById(taskId, actor) {
        const task = await housekeepingRepository.findTaskById(taskId);
        if (!task) {
            throw new AppError('Housekeeping task not found', 404);
        }
        if (actor.role === 'housekeeping') {
            const assignedUserId = getEntityId(task.assignedToUserId);
            if (assignedUserId && assignedUserId !== actor.id) {
                throw new AppError('You can only access your own or unassigned housekeeping tasks', 403);
            }
        }
        return serializeTask(task.toObject());
    },
    async getBoard(actor) {
        const filter = { deletedAt: null };
        if (actor.role === 'housekeeping') {
            filter.$or = [{ assignedToUserId: actor.id }, { assignedToUserId: null }];
        }
        const [rooms, tasks] = await Promise.all([
            RoomModel.find({ deletedAt: null }).sort({ roomNumber: 1 }).lean(),
            housekeepingRepository.listAllTasks(filter),
        ]);
        const latestTaskByRoom = new Map();
        tasks.forEach((task) => {
            const roomValue = task.roomId;
            const roomId = getEntityId(roomValue) ?? '';
            if (roomId && !latestTaskByRoom.has(roomId)) {
                latestTaskByRoom.set(roomId, task);
            }
        });
        const groups = {
            dirty: [],
            in_progress: [],
            inspected: [],
            clean: [],
        };
        rooms.forEach((room) => {
            const roomId = room._id.toString();
            const boardCard = {
                id: roomId,
                roomNumber: room.roomNumber,
                floor: room.floor,
                status: room.status,
                housekeepingStatus: room.housekeepingStatus,
                activeTask: latestTaskByRoom.get(roomId) ?? null,
            };
            groups[room.housekeepingStatus]?.push(boardCard);
        });
        return {
            groups,
            counts: Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.length])),
        };
    },
    async startTask(taskId, context) {
        const existingTask = await housekeepingRepository.findTaskById(taskId);
        if (!existingTask) {
            throw new AppError('Housekeeping task not found', 404);
        }
        if (['completed', 'cancelled'].includes(existingTask.status)) {
            throw new AppError('This housekeeping task can no longer be started', 409);
        }
        const updatedTask = await housekeepingRepository.updateTaskById(taskId, {
            status: 'in_progress',
            assignedToUserId: context.actorUserId,
            startedAt: new Date(),
        });
        if (existingTask.roomId) {
            await RoomModel.findByIdAndUpdate(existingTask.roomId, { housekeepingStatus: 'in_progress' });
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'housekeeping.start',
            entityType: 'housekeeping_task',
            entityId: taskId,
            before: serializeTask(existingTask.toObject()),
            after: serializeTask(updatedTask.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        return serializeTask(updatedTask.toObject());
    },
    async completeTask(taskId, context) {
        const existingTask = await housekeepingRepository.findTaskById(taskId);
        if (!existingTask) {
            throw new AppError('Housekeeping task not found', 404);
        }
        if (existingTask.status === 'completed') {
            throw new AppError('This housekeeping task is already completed', 409);
        }
        const updatedTask = await housekeepingRepository.updateTaskById(taskId, {
            status: 'completed',
            completedAt: new Date(),
            assignedToUserId: context.actorUserId,
        });
        if (existingTask.roomId) {
            const roomId = getEntityId(existingTask.roomId);
            const blockingMaintenance = await MaintenanceRequestModel.countDocuments({
                roomId,
                deletedAt: null,
                status: { $in: ['open', 'assigned', 'in_progress'] },
            });
            await RoomModel.findByIdAndUpdate(existingTask.roomId, {
                status: blockingMaintenance > 0 ? 'maintenance' : 'available',
                housekeepingStatus: 'clean',
                lastCleanedAt: new Date(),
            });
        }
        await auditService.createLog({
            userId: context.actorUserId,
            action: 'housekeeping.complete',
            entityType: 'housekeeping_task',
            entityId: taskId,
            before: serializeTask(existingTask.toObject()),
            after: serializeTask(updatedTask.toObject()),
            ip: context.request?.ip,
            userAgent: context.request?.headers['user-agent'] ?? null,
        });
        await notificationsService.createNotification({
            type: 'housekeeping',
            title: 'Housekeeping task completed',
            message: 'A room cleaning task has been completed and the room state was updated.',
            targetRoles: ['admin', 'manager', 'receptionist'],
            link: '/housekeeping/board',
            priority: 'medium',
        });
        return serializeTask(updatedTask.toObject());
    },
};
