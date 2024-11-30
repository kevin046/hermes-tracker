import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Auth from '@/components/Auth'
import { supabase } from '@/lib/supabase'

describe('Auth Component', () => {
  it('renders login form', () => {
    render(<Auth />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('handles login submission', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.auth.signInWithPassword as jest.Mock).mockImplementation(mockSignIn)

    render(<Auth />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message on login failure', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      error: new Error('Invalid credentials'),
    })
    ;(supabase.auth.signInWithPassword as jest.Mock).mockImplementation(mockSignIn)

    render(<Auth />)
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    })
  })
}) 