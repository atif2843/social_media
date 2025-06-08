'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [googleAdsAccount, setGoogleAdsAccount] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkGoogleAdsAccount()
    fetchCampaigns()
  }, [])

  async function checkGoogleAdsAccount() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('platform', 'google_ads')
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        throw error
      }
      
      setGoogleAdsAccount(data || null)
    } catch (error) {
      toast.error('Error checking Google Ads account: ' + error.message)
    }
  }

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('google_ads_campaigns')
        .select('*, google_ads_ad_groups(count)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      toast.error('Error fetching campaigns: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCreateCampaign() {
    router.push('/ads/create')
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'ended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!googleAdsAccount) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Google Ads</CardTitle>
            <CardDescription>
              Connect your Google Ads account to create and manage campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              You need to connect your Google Ads account before you can create campaigns.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/settings')}>Connect Google Ads Account</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Google Ads Campaigns</h1>
        <Button onClick={handleCreateCampaign}>Create Campaign</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No campaigns found. Create your first campaign!</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map(campaign => (
              <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push(`/ads/campaign/${campaign.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.campaign_name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>
                  <CardDescription>
                    Budget: ${campaign.budget} {campaign.budget_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(campaign.start_date).toLocaleDateString()} - 
                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                  </p>
                  <p className="text-sm mt-2">
                    {campaign.google_ads_ad_groups?.count || 0} ad groups
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {campaigns.filter(c => c.status === 'active').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No active campaigns found.</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.filter(c => c.status === 'active').map(campaign => (
              <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push(`/ads/campaign/${campaign.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.campaign_name}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">active</Badge>
                  </div>
                  <CardDescription>
                    Budget: ${campaign.budget} {campaign.budget_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(campaign.start_date).toLocaleDateString()} - 
                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                  </p>
                  <p className="text-sm mt-2">
                    {campaign.google_ads_ad_groups?.count || 0} ad groups
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="draft" className="space-y-4">
          {campaigns.filter(c => c.status === 'draft').length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No draft campaigns found.</p>
              </CardContent>
            </Card>
          ) : (
            campaigns.filter(c => c.status === 'draft').map(campaign => (
              <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push(`/ads/campaign/${campaign.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.campaign_name}</CardTitle>
                    <Badge className="bg-gray-100 text-gray-800">draft</Badge>
                  </div>
                  <CardDescription>
                    Budget: ${campaign.budget} {campaign.budget_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {new Date(campaign.start_date).toLocaleDateString()} - 
                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}