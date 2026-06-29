import * as petiti from './petitiService.js';
import * as security from './petitiSecurityEngine.js';
import * as marketplace from './petitiMarketplaceEngine.js';
import * as monitoring from './petitiMonitoringEngine.js';

export async function getDashboard(req, res) {
  try {
    const [health, snapshot, openAlerts] = await Promise.all([
      monitoring.runHealthCheck(),
      marketplace.marketplaceSnapshot(),
      petiti.listAlerts({ status: 'open' })
    ]);
    res.json({ health, snapshot, openAlerts, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('PETITI dashboard error:', err);
    res.status(500).json({ error: 'PETITI could not assemble the dashboard.' });
  }
}

export async function getLogs(req, res) {
  const { level, limit } = req.query;
  const logs = await petiti.listLogs({ actor: 'petiti', level, limit });
  res.json({ logs });
}

export async function getAlerts(req, res) {
  const { status, severity } = req.query;
  const alerts = await petiti.listAlerts({ status, severity });
  res.json({ alerts });
}

export async function postResolveAlert(req, res) {
  const alert = await petiti.resolveAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });
  res.json({ message: 'Alert resolved.', alert });
}

export async function getActions(req, res) {
  const actions = await petiti.listActions({ status: req.query.status });
  res.json({ actions });
}

export async function postApproveAction(req, res) {
  const action = await petiti.executeApprovedAction(req.params.id, req.user.id);
  if (!action) return res.status(404).json({ error: 'Action not found or already handled.' });
  res.json({ message: 'Action approved and executed.', action });
}

export async function getSecurityOverview(req, res) {
  const reports = await security.listFraudReports({});
  res.json({ reports });
}

export async function postRunSecurityScan(req, res) {
  const summary = await security.runFullScan();
  res.json({ message: 'Security scan complete.', summary });
}

export async function getRiskScore(req, res) {
  const score = await security.computeRiskScore(req.params.userId);
  res.json(score);
}

export async function getMarketplaceIntelligence(req, res) {
  const snapshot = await marketplace.marketplaceSnapshot();
  res.json({ snapshot });
}

export async function getRecommendations(req, res) {
  const recommendations = await marketplace.generateRecommendations();
  res.json({ recommendations });
}

export async function getHealthHistory(req, res) {
  const history = await monitoring.recentHealth();
  res.json({ history });
}

// ===== Site-editing surface =====
export async function putLogo(req, res) {
  await petiti.updateLogo(req.body.logoUrl);
  res.json({ message: 'Logo updated by PETITI.' });
}
export async function putTheme(req, res) {
  const settings = await petiti.updateTheme(req.body);
  res.json({ message: 'Theme updated by PETITI.', settings });
}
export async function putCustomCss(req, res) {
  await petiti.updateCustomCss(req.body.css || '');
  res.json({ message: 'Custom CSS updated by PETITI.' });
}
export async function getPages(req, res) {
  const pages = await petiti.listPages();
  res.json({ pages });
}
export async function postPage(req, res) {
  const page = await petiti.createOrUpdatePage(req.body);
  res.status(201).json({ message: 'Page published by PETITI.', page });
}
export async function deletePageHandler(req, res) {
  await petiti.deletePage(req.params.id);
  res.json({ message: 'Page removed.' });
}
export async function postProposeCodeChange(req, res) {
  const action = await petiti.proposeCodeChange(req.body);
  res.status(201).json({ message: 'Code change proposed for human review.', action });
}
