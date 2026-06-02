const prisma = require('../config/prisma');

exports.getOverview = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const setting = await prisma.setting.findUnique({
      where: { organizationId },
      select: { defaultLowStockThreshold: true }
    });

    const defaultThreshold = setting?.defaultLowStockThreshold ?? 5;

    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' }
    });

    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

    const lowStockItems = products
      .filter((product) => {
        const threshold = product.lowStockThreshold ?? defaultThreshold;
        return product.quantity <= threshold;
      })
      .slice(0, 10)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        lowStockThreshold: product.lowStockThreshold ?? defaultThreshold
      }));

    return res.json({
      totalProducts,
      totalQuantity,
      lowStockItems
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard overview' });
  }
};
