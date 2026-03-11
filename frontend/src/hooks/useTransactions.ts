import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TransactionFilters {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    search?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
}

export const useTransactions = (filters: TransactionFilters = {}) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            const { data } = await api.get('/transactions', {
                params: {
                    ...filters,
                    limit: filters.limit || 10,
                    page: filters.page || 1,
                },
            });
            return data;
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
};
