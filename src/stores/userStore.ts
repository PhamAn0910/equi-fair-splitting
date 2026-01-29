import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    name: string;
    defaultCurrency: string;
    setName: (name: string) => void;
    setDefaultCurrency: (currency: string) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            name: 'You',
            defaultCurrency: 'VND',
            setName: (name) => set({ name }),
            setDefaultCurrency: (defaultCurrency) => set({ defaultCurrency }),
        }),
        {
            name: 'user-storage',
        }
    )
);
