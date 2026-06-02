const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

router.use(authMiddleware);
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
