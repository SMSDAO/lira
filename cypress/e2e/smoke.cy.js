describe('Lira Web — Smoke Tests', () => {
  it('loads the home page', () => {
    cy.visit('/');
    cy.get('body').should('exist');
  });

  it('loads the dashboard page', () => {
    cy.visit('/dashboard', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });
});
