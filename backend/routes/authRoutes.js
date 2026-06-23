// backend/routes/authRoutes.js
//
// Autenticacion Google OAuth 2.0.  /api/auth
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/login', authController.login);       // -> { authUrl }
router.get('/callback', authController.callback);  // redirect_uri de Google
router.get('/me', protect, authController.me);
router.post('/logout', authController.logout);

module.exports = router;