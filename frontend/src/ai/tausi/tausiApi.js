import client from '../../api/client';

const base = '/ai/tausi';

export const getDashboard = () => client.get(`${base}/dashboard`);
export const getProductIntelligence = () => client.get(`${base}/product-intelligence`);
export const getSellerPerformance = () => client.get(`${base}/seller-performance`);
export const recomputeScores = () => client.post(`${base}/scores/recompute`);
export const getRanked = (category, limit) => client.get(`${base}/ranked`, { params: { category, limit } });
export const getMyRecommendations = () => client.get(`${base}/recommendations/mine`);

export const getCampaigns = (status) => client.get(`${base}/campaigns`, { params: { status } });
export const createCampaign = (payload) => client.post(`${base}/campaigns`, payload);
export const reviewCampaign = (id, decision) => client.post(`${base}/campaigns/${id}/review`, { decision });
export const recomputeAdScores = () => client.post(`${base}/campaigns/recompute-scores`);
