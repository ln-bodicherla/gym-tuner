import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAccount {
  admin_id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminAuthContextType {
  adminUser: AdminAccount | null;
  signInAdmin: (email: string, password: string) => Promise<{ error: any }>;
  signOutAdmin: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session in localStorage
    const savedAdmin = localStorage.getItem('gymtuner_admin_session');
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdminUser(adminData);
      } catch (error) {
        console.error('Error parsing saved admin session:', error);
        localStorage.removeItem('gymtuner_admin_session');
      }
    }
    setLoading(false);
  }, []);

  const signInAdmin = async (email: string, password: string) => {
    try {
      console.log('Attempting admin login for:', email);
      
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        input_email: email,
        input_password: password
      });

      if (error) {
        console.error('Admin login error:', error);
        return { error };
      }

      if (!data || data.length === 0) {
        return { error: { message: 'Invalid admin credentials' } };
      }

      const adminData = data[0];
      console.log('Admin login successful:', adminData);
      
      setAdminUser(adminData);
      localStorage.setItem('gymtuner_admin_session', JSON.stringify(adminData));
      
      return { error: null };
    } catch (error) {
      console.error('Admin login error:', error);
      return { error };
    }
  };

  const signOutAdmin = () => {
    console.log('Admin signing out');
    setAdminUser(null);
    localStorage.removeItem('gymtuner_admin_session');
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, signInAdmin, signOutAdmin, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};