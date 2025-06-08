'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

export default function CreateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    campaign_name: '',
    budget: '',
    budget_type: 'daily',
    start_date: new Date(),
    end_date: null,
    targeting: {
      locations: [],
      interests: [],
      demographics: {
        age_min: 18,
        age_max: 65,
        genders: ['all']
      }
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }))
  }

  const handleTargetingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        [category]: value
      }
    }))
  }

  const handleDemographicsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        demographics: {
          ...prev.targeting.demographics,
          [field]: value
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form data
      if (!formData.campaign_name) {
        toast.error('Campaign name is required')
        return
      }

      if (!formData.budget || isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) <= 0) {
        toast.error('Please enter a valid budget amount')
        return
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to create campaigns')
        router.push('/login')
        return
      }

      // Get the Google Ads account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('platform', 'google_ads')
        .eq('user_id', user.id)
        .single()

      if (accountError) {
        toast.error('You need to connect your Google Ads account first')
        router.push('/settings')
        return
      }

      // Create the campaign
      const { data, error } = await supabase
        .from('google_ads_campaigns')
        .insert([
          {
            user_id: user.id,
            account_id: accountData.id,
            campaign_name: formData.campaign_name,
            status: 'draft',
            budget: parseFloat(formData.budget),
            budget_type: formData.budget_type,
            start_date: formData.start_date.toISOString().split('T')[0],
            end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
            targeting: formData.targeting
          }
        ])
        .select()

      if (error) throw error

      toast.success('Campaign created successfully')
      router.push(`/ads/campaign/${data[0].id}`)
    } catch (error) {
      toast.error('Error creating campaign: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Google Ads Campaign</h1>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="campaign_name">Campaign Name</Label>
              <Input
                id="campaign_name"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Enter budget amount"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="budget_type">Budget Type</Label>
                <Select
                  value={formData.budget_type}
                  onValueChange={(value) => handleSelectChange('budget_type', value)}
                >
                  <SelectTrigger id="budget_type">
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Start Date</Label>
                <DatePicker
                  date={formData.start_date}
                  setDate={(date) => handleDateChange('start_date', date)}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>End Date (Optional)</Label>
                <DatePicker
                  date={formData.end_date}
                  setDate={(date) => handleDateChange('end_date', date)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Targeting</CardTitle>
            <CardDescription>Define who will see your ads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="locations">Locations (comma separated)</Label>
              <Input
                id="locations"
                name="locations"
                value={formData.targeting.locations.join(', ')}
                onChange={(e) => handleTargetingChange('locations', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                placeholder="e.g. United States, Canada, United Kingdom"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="interests">Interests (comma separated)</Label>
              <Input
                id="interests"
                name="interests"
                value={formData.targeting.interests.join(', ')}
                onChange={(e) => handleTargetingChange('interests', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                placeholder="e.g. Technology, Sports, Fashion"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="age_min">Minimum Age</Label>
                <Input
                  id="age_min"
                  name="age_min"
                  type="number"
                  min="13"
                  max="65"
                  value={formData.targeting.demographics.age_min}
                  onChange={(e) => handleDemographicsChange('age_min', parseInt(e.target.value))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="age_max">Maximum Age</Label>
                <Input
                  id="age_max"
                  name="age_max"
                  type="number"
                  min="13"
                  max="65"
                  value={formData.targeting.demographics.age_max}
                  onChange={(e) => handleDemographicsChange('age_max', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="genders">Gender</Label>
              <Select
                value={formData.targeting.demographics.genders[0]}
                onValueChange={(value) => handleDemographicsChange('genders', [value])}
              >
                <SelectTrigger id="genders">
                  <SelectValue placeholder="Select gender targeting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  )
}