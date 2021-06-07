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

export function eventRoutes(router: IRouter) {
  router.get(
    {
      path: NODE_API.GET_EVENTS,
      validate: {
        query: schema.object({
          from_index: schema.number(),
          max_items: schema.number(),
          query: schema.maybe(schema.string()),
          // config_type: schema.oneOf([
          //   schema.arrayOf(schema.string()),
          //   schema.string(),
          // ]),
          // feature_list: schema.maybe(
          //   schema.oneOf([schema.arrayOf(schema.string()), schema.string()])
          // ),
          // is_enabled: schema.maybe(schema.boolean()),
          sort_field: schema.string(),
          sort_order: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      // const featureStr = joinRequestParams(request.query.feature_list);
      // const feature_list = featureStr ? { feature_list: featureStr } : {};
      const query = request.query.query ? { query: request.query.query } : {};
      const client: ILegacyScopedClusterClient = context.notificationsContext.notificationsClient.asScoped(
        request
      );
      try {
        const resp = await client.callAsCurrentUser('notifications.getEvents', {
          from_index: request.query.from_index,
          max_items: request.query.max_items,
          // is_enabled: request.query.is_enabled,
          sort_field: request.query.sort_field,
          sort_order: request.query.sort_order,
          // ...feature_list,
          ...query,
        });
        return response.ok({ body: resp });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${NODE_API.GET_EVENT}/{eventId}`,
      validate: {
        params: schema.object({
          eventId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client: ILegacyScopedClusterClient = context.notificationsContext.notificationsClient.asScoped(
        request
      );
      try {
        const resp = await client.callAsCurrentUser(
          'notifications.getEventById',
          { eventId: request.params.eventId }
        );
        return response.ok({ body: resp });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
