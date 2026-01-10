/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assessments from "../assessments.js";
import type * as credits from "../credits.js";
import type * as documents from "../documents.js";
import type * as keypairs from "../keypairs.js";
import type * as loanRequests from "../loanRequests.js";
import type * as nilai from "../nilai.js";
import type * as users from "../users.js";
import type * as wallets from "../wallets.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assessments: typeof assessments;
  credits: typeof credits;
  documents: typeof documents;
  keypairs: typeof keypairs;
  loanRequests: typeof loanRequests;
  nilai: typeof nilai;
  users: typeof users;
  wallets: typeof wallets;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
