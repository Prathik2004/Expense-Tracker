import { useInfiniteQuery } from '@tanstack/react-query';
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
}

export const useTransactions = (filters: TransactionFilters = {}) => {
    return useInfiniteQuery({
        queryKey: ['transactions', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get('/transactions', {
                params: {
                    ...filters,
                    page: pageParam,
                    limit: 10,
                },
            });
            return data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.currentPage < lastPage.totalPages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
