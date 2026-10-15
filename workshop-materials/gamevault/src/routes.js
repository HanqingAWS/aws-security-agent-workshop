const express = require('express');
const router = express.Router();
const { login, requireAuth } = require('./auth');
const { getPlayer } = require('./players');
const { submitScore, searchLeaderboard } = require('./scores');
const { confirmPurchase } = require('./iap');
const admin = require('./admin');

// 公共
router.post('/login', (req, res) => login(req, res, req.db));
router.get('/leaderboard/search', (req, res) => searchLeaderboard(req, res, req.db));

// 需登录
router.get('/players/:id', requireAuth, (req, res) => getPlayer(req, res, req.db));
router.post('/scores', requireAuth, (req, res) => submitScore(req, res, req.db));
router.post('/iap/confirm', requireAuth, (req, res) => confirmPurchase(req, res, req.db));

// ❌ GM 路由:本应有 requireAuth + requireAdmin,这里完全没有鉴权中间件
router.get('/admin/players', (req, res) => admin.listPlayers(req, res, req.db));
router.post('/admin/players/:id/grant', (req, res) => admin.grantCoins(req, res, req.db));
router.post('/admin/players/:id/ban', (req, res) => admin.banPlayer(req, res, req.db));

module.exports = router;
