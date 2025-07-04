import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import {
  AuthenticatedRequest,
  requireAdmin,
  requireAuth,
} from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Fetch Orders
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Place Order
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { address, paymentMode } = req.body;

  if (!["COD", "ONLINE"].includes(paymentMode)) {
    res.status(400).json({ error: "Invalid payment mode" });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const total = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  if (!total) {
    res.status(400).json({ error: "Invalid total" });
    return;
  }

  if (paymentMode === "COD") {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          address,
          total,
          paymentMode,
          paymentStatus: "PAID",
          status: "PLACED",
        },
      });
      // Create order items
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });

        // Deduct Stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return createdOrder;
    });
    res.status(201).json({ message: "Order Placed Successfully", order });
  }

  if (paymentMode === "ONLINE") {
    // TODO: Implement Razorpay payment integration
    res.status(200).json({ message: "Payment Successful" });
  }
});

// Change Order Status -- Admin Only
router.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PLACED", "SHIPPED", "DELIVERED"];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const currentIndex = allowedStatuses.indexOf(order.status);
    const newIndex = allowedStatuses.indexOf(status);

    if (newIndex < currentIndex) {
      res.status(400).json({ error: "Cannot downgrade status" });
      return;
    }

    try {
      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });

      res.json({ message: "Order status updated", order: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
);

export default router;
