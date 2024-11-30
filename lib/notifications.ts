import { supabase } from './supabase'

export async function checkAndNotify() {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to send notifications')
    }

    // Log the notification attempt
    await supabase.from('notification_logs').insert([
      {
        sent_at: new Date().toISOString(),
        success: true,
      },
    ])
  } catch (error) {
    console.error('Error in checkAndNotify:', error)
    
    // Log failed attempt
    await supabase.from('notification_logs').insert([
      {
        sent_at: new Date().toISOString(),
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
    ])
  }
} 