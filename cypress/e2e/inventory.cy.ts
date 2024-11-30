describe('Inventory Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('displays inventory items', () => {
    cy.findByText(/hermes inventory tracker/i).should('exist')
    cy.findByPlaceholderText(/search products/i).should('exist')
    
    // Wait for items to load
    cy.findByText(/loading inventory/i).should('exist')
    cy.findByText(/loading inventory/i).should('not.exist')
    
    // Check if items are displayed
    cy.get('[data-testid="inventory-item"]').should('have.length.at.least', 1)
  })

  it('filters inventory items', () => {
    cy.findByPlaceholderText(/search products/i).type('birkin')
    cy.get('[data-testid="inventory-item"]').each(($item) => {
      cy.wrap($item).should('contain.text', /birkin/i)
    })
  })

  it('shows product details', () => {
    cy.get('[data-testid="inventory-item"]').first().within(() => {
      cy.findByText(/sku:/i).should('exist')
      cy.findByText(/(in stock|out of stock)/i).should('exist')
      cy.findByText(/view on hermes/i).should('exist')
    })
  })
}) 