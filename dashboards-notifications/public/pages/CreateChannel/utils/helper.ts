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

import { CUSTOM_WEBHOOK_ENDPOINT_TYPE } from '../../../utils/constants';
import { HeaderItemType } from '../../Channels/types';

export const serializeWebhook = (
  webhookTypeIdSelected: keyof typeof CUSTOM_WEBHOOK_ENDPOINT_TYPE,
  webhookURL: string,
  customURLHost: string,
  customURLPort: string,
  customURLPath: string,
  webhookParams: HeaderItemType[],
  webhookHeaders: HeaderItemType[]
) => {
  let url: string;
  if (webhookTypeIdSelected === 'WEBHOOK_URL') {
    url = webhookURL;
  } else {
    url = `https://${customURLHost.replace(/^https:\/\//, '')}`;
    if (customURLPort) url += `:${customURLPort}`;
    if (customURLPath) url += `/${customURLPath.replace(/^\//, '')}`;
    if (webhookParams.length > 0) {
      const params = new URLSearchParams(
        webhookParams
          .filter(({ key, value }) => key)
          .map(({ key, value }) => [key, value])
      );
      url += '?' + params.toString();
    }
  }
  const header_params = webhookHeaders
    .filter(({ key, value }) => key)
    .reduce((prev, curr) => ({ ...prev, [curr.key]: curr.value }), {});
  return { url, header_params };
};

export const deserializeWebhook = (webhook: {
  url: string;
  header_params: object;
}): {
  webhookURL: string;
  customURLHost: string;
  customURLPort: string;
  customURLPath: string;
  webhookParams: HeaderItemType[];
  webhookHeaders: HeaderItemType[];
} => {
  try {
    const url = new URL(webhook.url);
    const customURLHost = url.hostname;
    const customURLPort = url.port;
    const customURLPath = url.pathname.replace(/^\//, '');
    const webhookParams: HeaderItemType[] = [];
    url.searchParams.forEach((value, key) =>
      webhookParams.push({ key, value })
    );
    const webhookHeaders = Object.entries(
      webhook.header_params
    ).map(([key, value]) => ({ key, value }));
    return {
      webhookURL: webhook.url,
      customURLHost,
      customURLPort,
      customURLPath,
      webhookParams,
      webhookHeaders,
    };
  } catch (error) {
    console.error('Error parsing url:', error);
    return {
      webhookURL: webhook.url,
      customURLHost: '',
      customURLPort: '',
      customURLPath: '',
      webhookParams: [],
      webhookHeaders: [],
    };
  }
};
