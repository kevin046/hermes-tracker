'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NotificationSettings() {
  const [interval, setInterval] = useState('30')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'notification_interval', value: interval })

      if (error) throw error

      setStatus('success')
    } catch (error) {
      console.error('Error updating settings:', error)
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="interval"
          className="block text-sm font-medium text-gray-700"
        >
          Check Interval (minutes)
        </label>
        <select
          id="interval"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'loading' ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
} 