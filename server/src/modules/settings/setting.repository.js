import { SettingModel } from './setting.model.js';
export const settingRepository = {
    findCurrent: () => SettingModel.findOne().sort({ createdAt: -1 }),
    updateCurrent: async (payload) => {
        const current = await SettingModel.findOne().sort({ createdAt: -1 });
        if (!current) {
            return SettingModel.create(payload);
        }
        Object.assign(current, payload);
        await current.save();
        return current;
    },
};
