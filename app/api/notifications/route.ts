import { supabase } from '@/lib/supabase'
import sgMail from '@sendgrid/mail'
import { NextResponse } from 'next/server'

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST() {
  try {
    // Get all available inventory items
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .eq('available', true)

    if (inventoryError) throw inventoryError

    if (!inventory || inventory.length === 0) {
      return NextResponse.json({ message: 'No available inventory to notify about' })
    }

    // Get all subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('email')

    if (subscribersError) throw subscribersError

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers to notify' })
    }

    // Prepare email content
    const emailContent = {
      subject: 'Hermes Inventory Update',
      html: `
        <h2>New Items Available!</h2>
        <p>The following items are currently in stock:</p>
        <ul>
          ${inventory
            .map(
              (item) => `
            <li>
              ${item.product_name} (SKU: ${item.sku})
            </li>
          `
            )
            .join('')}
        </ul>
        <p>Visit our website to learn more!</p>
      `,
    }

    // Send emails to all subscribers
    const emails = subscribers.map((subscriber) => ({
      to: subscriber.email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      ...emailContent,
    }))

    await sgMail.send(emails)

    return NextResponse.json({ success: true, emailsSent: subscribers.length })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
} 