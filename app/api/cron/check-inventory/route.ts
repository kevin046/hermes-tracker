import { NextResponse } from 'next/server'
import { syncInventory } from '@/lib/services/inventory'

export const runtime = 'edge'
export const preferredRegion = 'fra1'

export async function GET(request: Request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncInventory()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Failed to check inventory' },
      { status: 500 }
    )
  }
} 