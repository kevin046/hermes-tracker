import '@testing-library/cypress/add-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      findByLabelText(label: string | RegExp): Chainable<JQuery<HTMLElement>>
      findByRole(role: string, options?: { name: string | RegExp }): Chainable<JQuery<HTMLElement>>
      findByText(text: string | RegExp): Chainable<JQuery<HTMLElement>>
      findByPlaceholderText(placeholder: string | RegExp): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
}) 