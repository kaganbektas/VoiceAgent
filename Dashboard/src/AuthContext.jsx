import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tenant = localStorage.getItem('tenant');
        if (token && tenant) {
            api.setToken(token);
            setUser(JSON.parse(tenant));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        api.setToken(data.token);
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        setUser(data.tenant);
        return data;
    };

    const register = async (formData) => {
        const data = await api.register(formData);
        api.setToken(data.token);
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        setUser(data.tenant);
        return data;
    };

    const logout = () => {
        api.setToken(null);
        localStorage.removeItem('tenant');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
