const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.use(authMiddleware);
router.get('/', dashboardController.getOverview);

module.exports = router;
