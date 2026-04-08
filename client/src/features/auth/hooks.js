import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/app/store/auth-store';
import { getRoleLandingPath } from '@/features/auth/components/role-landing';
import { getApiErrorMessage } from '@/lib/api-error';
export const useLogin = (onSuccessNavigate) => {
    const setUser = useAuthStore((state) => state.setUser);
    return useMutation({
        mutationFn: (values) => authApi.login(values),
        onSuccess: (user) => {
            setUser(user);
            toast.success('Welcome back to LuxuryStay.');
            onSuccessNavigate(getRoleLandingPath(user.role));
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to sign in right now.'));
        },
    });
};
export const useRegister = (onSuccessNavigate) => {
    const setUser = useAuthStore((state) => state.setUser);
    return useMutation({
        mutationFn: (values) => authApi.register(values),
        onSuccess: (user) => {
            setUser(user);
            toast.success('Your guest account is ready.');
            onSuccessNavigate(getRoleLandingPath(user.role));
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to create the guest account.'));
        },
    });
};
export const useForgotPassword = () => useMutation({
    mutationFn: (values) => authApi.forgotPassword(values),
    onSuccess: (response) => {
        toast.success(response.message);
    },
    onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Unable to start password reset.'));
    },
});
export const useResetPassword = (onSuccessNavigate) => {
    const setUser = useAuthStore((state) => state.setUser);
    return useMutation({
        mutationFn: (values) => authApi.resetPassword(values),
        onSuccess: (user) => {
            setUser(user);
            toast.success('Password reset successfully.');
            onSuccessNavigate(getRoleLandingPath(user.role));
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to reset the password.'));
        },
    });
};
export const useMyProfile = () => useQuery({
    queryKey: ['my-profile'],
    queryFn: () => authApi.me(),
});
export const useUpdateMe = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const authUser = useAuthStore((state) => state.user);
    return useMutation({
        mutationFn: (values) => authApi.updateMe(values),
        onSuccess: (updatedUser) => {
            setUser({ ...(authUser ?? {}), ...updatedUser });
            toast.success('Profile updated successfully.');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Unable to update profile.'));
        },
    });
};
