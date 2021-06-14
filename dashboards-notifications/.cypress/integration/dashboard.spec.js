/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/// <reference types="cypress" />

import { delay } from '../utils/constants';

describe.skip('Test empty messages', () => {
  const visit = (url) => {
    cy.visit(
      `${Cypress.env(
        'opensearchDashboards'
      )}/app/notifications-dashboards#${url}`
    );
    cy.wait(delay * 3);
  };

  it('displays empty message when no channels', () => {
    visit('notifications');
    expect(cy.contains('You have no channels set up')).to.not.be.null;
  });

  it('displays empty message for channels', () => {
    visit('channels');
    expect(cy.contains('No channels to display')).to.not.be.null;
  });

  it('displays empty message for email groups', () => {
    visit('email-groups');
    cy.contains('No senders to display').should('exist');
    cy.contains('No recipient groups to display').should('exist');
  });
});

describe('Test create channels', () => {
  beforeEach(() => {
    cy.visit(
      `${Cypress.env(
        'opensearchDashboards'
      )}/app/notifications-dashboards#create-channel`
    );
    cy.wait(delay * 3);
  });

  it('creates a slack channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('Test slack channel');
    cy.get('.euiCheckbox__input[id="alerting"]').click({force: true});
    cy.get('[data-test-subj="create-channel-create-button"]').click();

    cy.contains('Some fields are invalid.').should('exist');

    cy.get('[data-test-subj="create-channel-slack-webhook-input"]').type(
      'https://test.slack.com'
    );
    cy.wait(delay);
    
    cy.get('[data-test-subj="create-channel-create-button"]').click({force: true});
    cy.wait(delay * 50);
    cy.contains('successfully created.').should('exist');
  });

  it.skip('creates a chime channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('Test chime channel');
    cy.get('.euiCheckbox__input[id="alerting"]').click({force: true});
    cy.get('[data-test-subj="create-channel-create-button"]').click();

    cy.contains('Some fields are invalid.').should('exist');

    cy.get('[data-test-subj="create-channel-chime-webhook-input"]').type(
      'https://test.chime.com'
    );
    cy.wait(delay);
    
    cy.get('[data-test-subj="create-channel-create-button"]').click();
    cy.wait(delay * 5);
    cy.contains('successfully created.').should('exist');
  });
});
