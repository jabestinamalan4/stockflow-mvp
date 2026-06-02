const prisma = require('../config/prisma');

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findUnique({
      where: { organizationId: req.user.organizationId }
    });

    return res.json(settings || { defaultLowStockThreshold: 5 });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const threshold = Number(req.body.defaultLowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      return res.status(400).json({
        message: 'defaultLowStockThreshold must be a non-negative integer'
      });
    }

    const updated = await prisma.setting.upsert({
      where: { organizationId: req.user.organizationId },
      update: { defaultLowStockThreshold: threshold },
      create: {
        organizationId: req.user.organizationId,
        defaultLowStockThreshold: threshold
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update settings' });
  }
};
