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

import { getErrorMessage, renderTime } from '../helpers';

jest.doMock('moment', () => {
  const moment = jest.requireActual('moment-timezone');
  moment.tz.setDefault('America/Los_Angeles');
  return moment;
});

describe('test helper functions', () => {
  it('returns default message if error not valid', () => {
    const message = getErrorMessage({}, 'default message');
    expect(message).toEqual('default message');
  });

  it('returns - if time is not valid', () => {
    const time = renderTime(NaN);
    expect(time).toEqual('-');
  });
});
