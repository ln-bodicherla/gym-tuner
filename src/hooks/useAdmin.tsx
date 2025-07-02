
import { useAdminAuth } from '@/hooks/useAdminAuth';

export const useAdmin = () => {
  const { adminUser, loading } = useAdminAuth();
  
  return { 
    isAdmin: !!adminUser, 
    loading,
    adminUser 
  };
};
