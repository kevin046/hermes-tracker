import { render, screen, waitFor } from '@testing-library/react'
import InventoryList from '@/components/InventoryList'
import { supabase } from '@/lib/supabase'

const mockInventory = [
  {
    id: '1',
    product_name: 'Birkin 25',
    sku: 'BK25-TOGO-NOIR',
    available: true,
    price: '10000',
    currency: 'EUR',
    url: 'https://example.com',
    last_checked: new Date().toISOString(),
  },
]

describe('InventoryList Component', () => {
  beforeEach(() => {
    ;(supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        data: mockInventory,
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    }))
  })

  it('renders loading state initially', () => {
    render(<InventoryList />)
    expect(screen.getByText(/loading inventory/i)).toBeInTheDocument()
  })

  it('renders inventory items', async () => {
    render(<InventoryList />)

    await waitFor(() => {
      expect(screen.getByText('Birkin 25')).toBeInTheDocument()
      expect(screen.getByText('SKU: BK25-TOGO-NOIR')).toBeInTheDocument()
      expect(screen.getByText('In Stock')).toBeInTheDocument()
    })
  })

  it('handles empty inventory', async () => {
    ;(supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      order: jest.fn().mockReturnThis(),
    }))

    render(<InventoryList />)

    await waitFor(() => {
      expect(screen.getByText(/no inventory items found/i)).toBeInTheDocument()
    })
  })
}) 