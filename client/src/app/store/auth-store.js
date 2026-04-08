import { create } from 'zustand';
const STORAGE_KEY = 'luxurystay-auth';
export const useAuthStore = create((set, get) => ({
    user: null,
    hydrated: false,
    setUser: (user) => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
        else {
            localStorage.removeItem(STORAGE_KEY);
        }
        set({ user });
    },
    hydrate: () => {
        const rawUser = localStorage.getItem(STORAGE_KEY);
        if (rawUser) {
            try {
                set({ user: JSON.parse(rawUser), hydrated: true });
                return;
            }
            catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        set({ hydrated: true });
    },
    logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ user: null });
    },
    isRole: (roles) => {
        const role = get().user?.role;
        return !!role && roles.includes(role);
    },
}));
