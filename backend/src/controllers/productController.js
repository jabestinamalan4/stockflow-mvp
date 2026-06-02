const prisma = require('../config/prisma');

const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

exports.listProducts = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();

    const where = {
      organizationId: req.user.organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list products' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch product' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, description, quantity, costPrice, sellingPrice, lowStockThreshold } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ message: 'name and sku are required' });
    }

    const created = await prisma.product.create({
      data: {
        organizationId: req.user.organizationId,
        name: String(name).trim(),
        sku: String(sku).trim(),
        description: description ? String(description).trim() : null,
        quantity: Number.isNaN(Number(quantity)) ? 0 : Number(quantity),
        costPrice: parseNullableNumber(costPrice),
        sellingPrice: parseNullableNumber(sellingPrice),
        lowStockThreshold: parseNullableNumber(lowStockThreshold)
      }
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'SKU must be unique per organization' });
    }

    return res.status(500).json({ message: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, sku, description, quantity, costPrice, sellingPrice, lowStockThreshold } = req.body;

    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        sku: sku !== undefined ? String(sku).trim() : existing.sku,
        description: description !== undefined
          ? (description ? String(description).trim() : null)
          : existing.description,
        quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
        costPrice: costPrice !== undefined ? parseNullableNumber(costPrice) : existing.costPrice,
        sellingPrice: sellingPrice !== undefined ? parseNullableNumber(sellingPrice) : existing.sellingPrice,
        lowStockThreshold: lowStockThreshold !== undefined
          ? parseNullableNumber(lowStockThreshold)
          : existing.lowStockThreshold
      }
    });

    return res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'SKU must be unique per organization' });
    }

    return res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({ where: { id: existing.id } });
    return res.json({ message: 'Product deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product' });
  }
};
