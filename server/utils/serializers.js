export function serializeUser(user) {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isAdmin: user.isAdmin,
    isSubscribedToNewsletter: user.isSubscribedToNewsletter,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function serializeOrderItem(item) {
  if (!item) return null;
  return {
    _id: item.id,
    product: item.productId,
    name: item.name,
    unitLabel: item.unitLabel || null,
    price: item.price,
    qty: item.quantity,
    quantity: item.quantity,
    image: item.image,
  };
}

export function serializeOrder(order) {
  if (!order) return null;

  let userField = order.userId || null;
  if (order.user) {
    userField = {
      _id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      phone: order.user.phone,
    };
  }

  return {
    _id: order.id,
    id: order.id,
    user: userField,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    guestName: order.guestName,
    items: (order.items || []).map(serializeOrderItem),
    orderItems: (order.items || []).map(serializeOrderItem),
    totalPrice: order.totalPrice,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    shippingAddress: order.shippingAddress,
    paymentInfo: {
      razorpayOrderId: order.razorpayOrderId,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
    isPaid: order.isPaid,
    paidAt: order.paidAt,
    shiprocketOrderId: order.shiprocketOrderId,
    shipmentId: order.shipmentId,
    awbCode: order.awbCode,
    courierName: order.courierName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function serializeVariant(v) {
  if (!v) return null;
  return {
    _id: v.id,
    id: v.id,
    productId: v.productId,
    unitLabel: v.unitLabel,
    price: v.price,
    stockQuantity: v.stockQuantity,
    sortOrder: v.sortOrder,
  };
}

export function serializeProduct(product) {
  if (!product) return null;
  const variants = (product.variants || [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(serializeVariant);

  return {
    _id: product.id,
    id: product.id,
    title: product.title,
    slug: product.slug,
    name: product.name,
    price: product.price,
    images: product.images,
    image: product.image,
    description: product.description,
    category: product.category,
    stockQuantity: product.stockQuantity,
    stock: product.stockQuantity,
    isActive: product.isActive,
    isBestseller: product.isBestseller,
    keyBenefits: product.keyBenefits || '',
    howToUse: product.howToUse || '',
    shippingReturns: product.shippingReturns || '',
    variants,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function serializeBlog(blog) {
  if (!blog) return null;

  let authorField = blog.authorId || null;
  if (blog.author) {
    authorField = {
      _id: blog.author.id,
      name: blog.author.name,
      email: blog.author.email,
    };
  }

  return {
    _id: blog.id,
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    featuredImage: blog.featuredImage,
    author: authorField,
    authorName: blog.authorName,
    isPublished: blog.isPublished,
    isFeatured: blog.isFeatured,
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

export function serializeSubscriber(sub) {
  if (!sub) return null;
  return {
    _id: sub.id,
    id: sub.id,
    email: sub.email,
    name: sub.name,
    source: sub.source,
    isActive: sub.isActive,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}
