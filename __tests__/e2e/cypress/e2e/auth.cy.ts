describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.findByLabelText(/email/i).should('exist')
    cy.findByLabelText(/password/i).should('exist')
    cy.findByRole('button', { name: /login/i }).should('exist')
  })

  it('should show error for invalid credentials', () => {
    cy.findByLabelText(/email/i).type('wrong@example.com')
    cy.findByLabelText(/password/i).type('wrongpassword')
    cy.findByRole('button', { name: /login/i }).click()
    cy.findByText(/invalid credentials/i).should('exist')
  })

  it('should redirect to admin dashboard after successful login', () => {
    cy.login('admin@example.com', 'correctpassword')
    cy.url().should('include', '/admin')
    cy.findByText(/admin dashboard/i).should('exist')
  })
}) 