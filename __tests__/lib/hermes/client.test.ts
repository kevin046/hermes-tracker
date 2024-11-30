import { hermesClient } from '@/lib/hermes/client'

describe('HermesClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('fetches inventory successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Birkin 25',
        sku: 'BK25',
        available: true,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, products: mockProducts }),
    })

    const products = await hermesClient.getInventory()

    expect(products).toEqual(mockProducts)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/inventory'),
      expect.any(Object)
    )
  })

  it('handles API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
      status: 404,
    })

    await expect(hermesClient.getInventory()).rejects.toThrow('API request failed')
  })
}) 