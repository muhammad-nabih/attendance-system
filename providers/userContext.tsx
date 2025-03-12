"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {  SupabaseClient } from '@supabase/supabase-js';
import {createClient} from "@/lib/supabase/client"

interface UserContextType {
    user: any;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    setUserDetails: React.Dispatch<React.SetStateAction<any>>;
    supabase: SupabaseClient;
    userDetails: any;

}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            const { data: userData, error:userDataError } = await supabase.from("users").select("*").eq("id", data?.user?.id).single()


            setUserDetails(userData);
            if (error) {
                console.error('Error fetching user:', error);
            } else {
                setUser(data.user);
            }
        };
        getUser();
    }, [supabase]);

    return (
        <UserContext.Provider value={{ user, setUser, supabase ,userDetails, setUserDetails}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
