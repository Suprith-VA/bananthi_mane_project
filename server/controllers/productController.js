import prisma from '../config/prisma.js';
import { serializeProduct } from '../utils/serializers.js';
import { isValidUUID, toSlug } from '../utils/helpers.js';

const INCLUDE_VARIANTS = { variants: { orderBy: { sortOrder: 'asc' } } };

// GET /api/products
export const getProducts = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.isAdmin;
    const bestsellersOnly = req.query.bestseller === 'true';
    const where = includeInactive
      ? bestsellersOnly ? { isBestseller: true } : {}
      : bestsellersOnly ? { isActive: true, isBestseller: true } : { isActive: true };

    const products = await prisma.product.findMany({
      where,
      include: INCLUDE_VARIANTS,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const where = isValidUUID(identifier)
      ? { id: identifier, isActive: true }
      : { slug: identifier, isActive: true };

    const product = await prisma.product.findFirst({
      where,
      include: INCLUDE_VARIANTS,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(serializeProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products  (admin)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      title,
      price,
      image,
      images,
      description,
      category,
      stock,
      stockQuantity,
      isActive,
      isBestseller,
      slug,
      variants,
      keyBenefits,
      howToUse,
      shippingReturns,
    } = req.body;

    const resolvedName = name || title;
    const resolvedTitle = title || name;
    if (!resolvedName) return res.status(400).json({ message: 'Product name/title is required' });
    if (!image && (!images || images.length === 0)) {
      return res.status(400).json({ message: 'At least one product image is required' });
    }

    // If variants supplied, use first variant's price as display price; otherwise require price
    const hasVariants = Array.isArray(variants) && variants.length > 0;
    const resolvedPrice = hasVariants
      ? Math.min(...variants.map(v => v.price))
      : price;
    if (resolvedPrice == null) return res.status(400).json({ message: 'Price is required (or provide at least one variant)' });

    const resolvedSlug = slug || toSlug(resolvedTitle);
    const resolvedStock = stockQuantity ?? stock ?? 100;
    const resolvedImages = images?.length ? images : image ? [image] : [];
    const resolvedImage = image || (images?.[0] ?? '/images/main.png');

    const product = await prisma.product.create({
      data: {
        name: resolvedName,
        title: resolvedTitle,
        slug: resolvedSlug,
        price: resolvedPrice,
        image: resolvedImage,
        images: resolvedImages,
        description: description || '',
        category: category || 'General',
        stockQuantity: resolvedStock,
        isActive: isActive ?? true,
        isBestseller: isBestseller ?? false,
        keyBenefits: keyBenefits || '',
        howToUse: howToUse || '',
        shippingReturns: shippingReturns || '',
        ...(hasVariants && {
          variants: {
            create: variants.map((v, i) => ({
              unitLabel: v.unitLabel,
              price: v.price,
              stockQuantity: v.stockQuantity ?? 50,
              sortOrder: v.sortOrder ?? i,
            })),
          },
        }),
      },
      include: INCLUDE_VARIANTS,
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A product with that slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/products/:id  (admin)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid product id is required' });
    }

    const { variants, ...rest } = req.body;
    const data = { ...rest };

    if (data.title && !data.name) data.name = data.title;
    if (data.name && !data.title) data.title = data.name;
    if (data.title && !data.slug) data.slug = toSlug(data.title);
    if (typeof data.stockQuantity === 'number' && typeof data.stock !== 'number') {
      data.stock = data.stockQuantity;
    }
    if (typeof data.stock === 'number' && typeof data.stockQuantity !== 'number') {
      data.stockQuantity = data.stock;
    }

    delete data.stock;
    delete data._id;
    delete data.id;

    // If variants supplied, sync the display price to the lowest variant
    if (Array.isArray(variants)) {
      if (variants.length > 0) {
        data.price = Math.min(...variants.map(v => v.price));
      }

      // Replace all variants: delete old, create new
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v, i) => ({
            productId: id,
            unitLabel: v.unitLabel,
            price: v.price,
            stockQuantity: v.stockQuantity ?? 50,
            sortOrder: v.sortOrder ?? i,
          })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: INCLUDE_VARIANTS,
    });

    res.json(serializeProduct(product));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A product with that slug already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/products/:id  (admin - soft delete)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ message: 'Valid product id is required' });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Product deactivated' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: error.message });
  }
};
