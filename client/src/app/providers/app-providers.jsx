import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/app/store/auth-store';
import { authApi } from '@/features/auth/api';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
export const AppProviders = ({ children }) => {
    const hydrate = useAuthStore((state) => state.hydrate);
    const hydrated = useAuthStore((state) => state.hydrated);
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const logout = useAuthStore((state) => state.logout);
    const hasSyncedSession = useRef(false);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (!user?.accessToken) {
            hasSyncedSession.current = false;
        }
    }, [user?.accessToken]);

    useEffect(() => {
        if (!hydrated || hasSyncedSession.current || !user?.accessToken) {
            return;
        }

        hasSyncedSession.current = true;
        let isMounted = true;

        const syncSession = async () => {
            try {
                const nextUser = await authApi.me();
                if (isMounted) {
                    setUser(nextUser);
                }
            }
            catch {
                try {
                    const refreshedUser = await authApi.refresh();
                    if (isMounted) {
                        setUser(refreshedUser);
                    }
                }
                catch {
                    if (isMounted) {
                        logout();
                    }
                }
            }
        };

        void syncSession();

        return () => {
            isMounted = false;
        };
    }, [hydrated, logout, setUser, user?.accessToken]);

    return (<QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors/>
    </QueryClientProvider>);
};
