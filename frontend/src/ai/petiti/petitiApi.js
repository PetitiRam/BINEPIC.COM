import client from '../../api/client';

const base = '/ai/petiti';

export const getDashboard = () => client.get(`${base}/dashboard`);
export const getLogs = (params) => client.get(`${base}/logs`, { params });
export const getAlerts = (params) => client.get(`${base}/alerts`, { params });
export const resolveAlert = (id) => client.post(`${base}/alerts/${id}/resolve`);
export const getActions = (params) => client.get(`${base}/actions`, { params });
export const approveAction = (id) => client.post(`${base}/actions/${id}/approve`);
export const getSecurity = () => client.get(`${base}/security`);
export const runSecurityScan = () => client.post(`${base}/security/scan`);
export const getMarketplaceIntel = () => client.get(`${base}/marketplace`);
export const getRecommendations = () => client.get(`${base}/recommendations`);
export const getHealthHistory = () => client.get(`${base}/health`);

export const updateLogo = (logoUrl) => client.put(`${base}/site/logo`, { logoUrl });
export const updateTheme = (payload) => client.put(`${base}/site/theme`, payload);
export const updateCustomCss = (css) => client.put(`${base}/site/css`, { css });
export const getPages = () => client.get(`${base}/site/pages`);
export const savePage = (payload) => client.post(`${base}/site/pages`, payload);
export const deletePage = (id) => client.delete(`${base}/site/pages/${id}`);
export const proposeCodeChange = (payload) => client.post(`${base}/site/propose-code-change`, payload);
