describe('Notification System', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'correctpassword')
    cy.visit('/admin')
  })

  it('displays notification settings', () => {
    cy.findByText(/notification settings/i).should('exist')
    cy.findByLabelText(/check interval/i).should('exist')
  })

  it('saves notification settings', () => {
    cy.findByLabelText(/check interval/i).select('30')
    cy.findByRole('button', { name: /save settings/i }).click()
    cy.findByText(/settings saved/i).should('exist')
  })

  it('shows notification history', () => {
    cy.findByText(/notification history/i).should('exist')
    cy.get('[data-testid="notification-log"]').should('have.length.at.least', 1)
  })
}) 