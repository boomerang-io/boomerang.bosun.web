import axios, { CancelToken } from "axios";
import HTTPMethods from "Constants/httpMethods";
import portForwardMap from "../setupPortForwarding";

//const REACT_APP_PORT_FORWARD = process.env.REACT_APP_PORT_FORWARD;

export const BASE_SERVICE_ENV_URL =
  process.env.NODE_ENV === "production" ? window._SERVER_DATA && window._SERVER_DATA.BASE_SERVICE_ENV_URL : "/api";

export const PRODUCT_SERVICE_ENV_URL =
  process.env.NODE_ENV === "production" ? window._SERVER_DATA && window._SERVER_DATA.PRODUCT_SERVICE_ENV_URL : "/api";

const REACT_APP_PORT_FORWARD = process.env.REACT_APP_PORT_FORWARD;

/**
 * if port forwarding is enabled, then check to see if service is in config map
 * If it is, set the url request to be only the serviceContextPath so the url is relativet to the root of the app
 * CRA will proxy the request as seen in setupProxy.js
 * @param {string} baseUrl - base of the serivce url
 * @param {sring} serviceContextPath - additional path for the service context e.g. /admin
 */
function determineUrl(baseUrl, serviceContextPath) {
  if (REACT_APP_PORT_FORWARD && portForwardMap[serviceContextPath]) {
    return serviceContextPath;
  } else {
    return baseUrl + serviceContextPath;
  }
}
export const BASE_SERVICE_USERS_URL = determineUrl(BASE_SERVICE_ENV_URL, "/users");
export const BASE_SERVICE_PRODUCT_URL = determineUrl(PRODUCT_SERVICE_ENV_URL, "/policy");
// Product
export const SERVICE_REQUEST_STATUSES = {
  FAILURE: "failure",
  SUCCESS: "success",
};

export const serviceUrl = {
  deletePolicy: ({policyId}) => `${BASE_SERVICE_PRODUCT_URL}/policies/${policyId}`,
  getInsights: ({teamId}) => `${BASE_SERVICE_PRODUCT_URL}/policies/insights?teamId=${teamId}`,
  getInsightsOverview: () => `${BASE_SERVICE_PRODUCT_URL}/policies/insights`,
  getNavigation: () => `${BASE_SERVICE_USERS_URL}/navigation`,
  getPolicies: () => `${BASE_SERVICE_PRODUCT_URL}/templates`,
  getPolicy: ({policyId}) => `${BASE_SERVICE_PRODUCT_URL}/policies/${policyId}`,
  getPolicyOverview: () => `${BASE_SERVICE_PRODUCT_URL}/policies`,
  getTeams: () => `${BASE_SERVICE_PRODUCT_URL}/teams`,
  getTeamPolicies: ({teamId}) => `${BASE_SERVICE_PRODUCT_URL}/policies?teamId=${teamId}`,
  getTemplates: () => `${BASE_SERVICE_PRODUCT_URL}/templates`,
  getUserProfile: () => `${BASE_SERVICE_USERS_URL}/profile`,
  getValidateInfo: ({policyId}) => `${BASE_SERVICE_PRODUCT_URL}/validate/info/${policyId}`,
  getViolations: ({teamId}) => `${BASE_SERVICE_PRODUCT_URL}/policies/violations?teamId=${teamId}`,
  getViolationsOverview: () => `${BASE_SERVICE_PRODUCT_URL}/policies/violations`,
  patchUpdatePolicy: ({policyId}) => `${BASE_SERVICE_PRODUCT_URL}/policies/${policyId}`,
  patchUpdatePolicyTemplate: ({templateId}) =>`${BASE_SERVICE_PRODUCT_URL}/templates/${templateId}`,
  postCreatePolicy: () => `${BASE_SERVICE_PRODUCT_URL}/policies`,
  postCreatePolicyTemplate: () => `${BASE_SERVICE_PRODUCT_URL}/templates`,
  postCreateTeam: () => `${BASE_SERVICE_PRODUCT_URL}/teams`,
};

export const cancellableResolver = ({ url, method, body, ...config }) => {
  // Create a new CancelToken source for this request
  const source = CancelToken.source();
  const promise = axios({ url, method, body, cancelToken: source.token, ...config });
  return { promise, cancel: () => source.cancel("cancel") };
};

export const resolver = {
  query: (url) => () => axios.get(url).then((response) => response.data),
  postMutation: (request) => axios.post(request),
  patchMutation: (request) => axios.patch(request),
  putMutation: (request) => axios.put(request),
  deletePolicy: ({policyId}) => axios.delete(serviceUrl.deletePolicy({policyId})),
  patchUpdatePolicy: ({policyId, body}) => axios.patch(serviceUrl.patchUpdatePolicy({policyId}), body),
  patchUpdatePolicyTemplate: ({templateId, body}) => axios.patch(serviceUrl.patchUpdatePolicyTemplate({templateId}), body),
  postCreatePolicy: ({ body }) => axios.post(serviceUrl.postCreatePolicy(), body),
  postCreatePolicyTemplate: ({ body }) => axios.post(serviceUrl.postCreatePolicyTemplate(), body),
  postCreateTeam: ({ body }) =>
    cancellableResolver({ url: serviceUrl.postCreateTeam(), data: body, method: HTTPMethods.Post }),
};