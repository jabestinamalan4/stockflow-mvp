const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

router.use(authMiddleware);

router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
