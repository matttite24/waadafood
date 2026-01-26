/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as chatConstants from "../chatConstants.js";
import type * as chatHelpers from "../chatHelpers.js";
import type * as clientes from "../clientes.js";
import type * as clientesPaginated from "../clientesPaginated.js";
import type * as comercios from "../comercios.js";
import type * as dashboard from "../dashboard.js";
import type * as etiquetas from "../etiquetas.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as mensajes from "../mensajes.js";
import type * as metrics from "../metrics.js";
import type * as notifications from "../notifications.js";
import type * as pedidos from "../pedidos.js";
import type * as plantillas from "../plantillas.js";
import type * as productos from "../productos.js";
import type * as stats from "../stats.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  chatConstants: typeof chatConstants;
  chatHelpers: typeof chatHelpers;
  clientes: typeof clientes;
  clientesPaginated: typeof clientesPaginated;
  comercios: typeof comercios;
  dashboard: typeof dashboard;
  etiquetas: typeof etiquetas;
  files: typeof files;
  http: typeof http;
  mensajes: typeof mensajes;
  metrics: typeof metrics;
  notifications: typeof notifications;
  pedidos: typeof pedidos;
  plantillas: typeof plantillas;
  productos: typeof productos;
  stats: typeof stats;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
