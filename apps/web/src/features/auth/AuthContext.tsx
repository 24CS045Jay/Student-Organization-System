import React, { createContext, useContext, useState, useEffect } from 'react';

type User = { id: string; email: string };
type Org = { id: string; slug: string; name: string; role: string };

interface AuthContextType {
  user: User | null;
  activeOrg: Org | null;
  orgs: Org[];
  login: (user: User, orgs: Org[]) => void;
  logout: () => void;
  switchOrg: (slug: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrg, setActiveOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);

  const login = (userData: User, orgsData: Org[]) => {
    setUser(userData);
    setOrgs(orgsData);
    if (orgsData.length > 0) {
      setActiveOrg(orgsData[0]);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveOrg(null);
    setOrgs([]);
  };

  const switchOrg = (slug: string) => {
    const org = orgs.find(o => o.slug === slug);
    if (org) setActiveOrg(org);
  };

  return (
    <AuthContext.Provider value={{ user, activeOrg, orgs, login, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
