'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import SocialAccountCard from '@/components/SocialAccountCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('social'); // 'social' or 'advertising'

  useEffect(() => {
    const fetchUserAndAccounts = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          toast.error('You must be logged in to view settings');
          return;
        }
        
        setUser(user);
        
        // Get the user's connected accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (accountsError) throw accountsError;
        
        setAccounts(accountsData || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndAccounts();
  }, []);
  
  const getAccountByPlatform = (platform) => {
    return accounts.find(account => account.platform === platform) || null;
  };
  
  const socialPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
  const advertisingPlatforms = ['google_ads'];
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      {user && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="bg-white shadow-md rounded-lg p-6">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'social' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Social Media Accounts
            </button>
            <button
              onClick={() => setActiveTab('advertising')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'advertising' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Advertising Accounts
            </button>
          </nav>
        </div>
        
        {activeTab === 'social' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Connected Social Media Accounts</h2>
            {socialPlatforms.map(platform => (
              <SocialAccountCard 
                key={platform}
                platform={platform}
                accountData={getAccountByPlatform(platform)}
                userId={user?.id}
              />
            ))}
          </div>
        )}
        
        {activeTab === 'advertising' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Connected Advertising Accounts</h2>
            {advertisingPlatforms.map(platform => (
              <SocialAccountCard 
                key={platform}
                platform={platform}
                accountData={getAccountByPlatform(platform)}
                userId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
