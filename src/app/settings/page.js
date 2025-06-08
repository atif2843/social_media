'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SocialAccountCard from '@/components/SocialAccountCard';
import supabase from '@/lib/supabase';
import useStore from '@/lib/store';

export default function SettingsPage() {
  const user = useStore((state) => state.user);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('social'); // 'social' or 'advertising'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh accounts data
  const refreshAccounts = () => {
    console.log('refreshAccounts called, updating refreshTrigger');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching accounts data for user:', user.id);
        
        // Get the user's connected accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (accountsError) throw accountsError;
        
        console.log('Accounts data received:', accountsData);
        setAccounts(accountsData || []);
      } catch (error) {
        console.error('Error fetching accounts data:', error);
        toast.error('Failed to load accounts data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, [user, refreshTrigger]); // Add refreshTrigger to dependencies
  
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
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>You must be logged in to view settings. Please <a href="/login?returnTo=/settings" className="text-blue-600 hover:underline">log in</a> to continue.</p>
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
                refreshAccounts={refreshAccounts}
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
                refreshAccounts={refreshAccounts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
