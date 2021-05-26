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

import { schema } from '@osd/config-schema';
import {
  ILegacyScopedClusterClient,
  IRouter,
} from '../../../../src/core/server';
import { NODE_API } from '../../../dashboards-notifications/common';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: NODE_API.GET_CHANNELS,
      validate: {
        query: schema.object({
          from_index: schema.number(),
          max_items: schema.number(),
          search: schema.string(),
          filters: schema.string(),
          sort_field: schema.string(),
          sort_order: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client: ILegacyScopedClusterClient = context.notifications_plugin.notificationsClient.asScoped(
        request
      );
      try {
        const resp = await client.callAsCurrentUser(
          'notifications.getConfigs',
          {
            from_index: request.query.from_index,
            max_items: request.query.max_items,
            sort_field: request.query.sort_field,
            sort_order: request.query.sort_order,
          }
        );
        return response.ok({
          body: resp,
        });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
