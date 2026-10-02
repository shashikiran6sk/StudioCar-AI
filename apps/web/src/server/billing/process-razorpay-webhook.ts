import type { RazorpayWebhook } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";
import { CreditLedgerType, PaymentStatus, SubscriptionStatus, WebhookProcessingStatus } from "@studiocar/database-runtime";

import { createReceipt } from "./create-receipt";

const LIFECYCLE_STATUS: Record<string, SubscriptionStatus> = {
  "subscription.authenticated": SubscriptionStatus.AUTHENTICATED,
  "subscription.activated": SubscriptionStatus.ACTIVE,
  "subscription.pending": SubscriptionStatus.PENDING,
  "subscription.halted": SubscriptionStatus.HALTED,
  "subscription.paused": SubscriptionStatus.PAUSED,
  "subscription.resumed": SubscriptionStatus.ACTIVE,
  "subscription.cancelled": SubscriptionStatus.CANCELLED,
  "subscription.completed": SubscriptionStatus.COMPLETED,
};

export async function processRazorpayWebhook(
  database: PrismaClient,
  eventId: string,
  event: RazorpayWebhook,
): Promise<void> {
  await database.$transaction(async (transaction) => {
    const inserted = await transaction.webhookEvent.createMany({
      data: [{
        provider: "RAZORPAY",
        externalId: eventId,
        eventType: event.event,
        payload: { event: event.event },
        signatureVerified: true,
        status: WebhookProcessingStatus.RECEIVED,
      }],
      skipDuplicates: true,
    });
    if (inserted.count === 0) return;

    const providerPayment = event.payload.payment?.entity;
    const providerSubscription = event.payload.subscription?.entity;
    if (providerSubscription) {
      const notes = providerSubscription.notes;
      const internalId = notes && !Array.isArray(notes) ? notes.internalSubscriptionId : undefined;
      if (internalId) {
        await transaction.planSubscription.updateMany({
          where: {
            id: internalId,
            providerSubscriptionId: null,
            razorpayPlanId: providerSubscription.plan_id,
            source: "PAYMENT_PROVIDER",
          },
          data: { providerSubscriptionId: providerSubscription.id },
        });
      }
    }
    if (event.event === "payment.captured" && providerPayment?.status === "captured" && providerPayment.order_id) {
      const payment = await transaction.payment.findUnique({
        where: { razorpayOrderId: providerPayment.order_id },
      });
      if (payment && payment.billingType === "ONE_TIME") {
        if (payment.amountPaise !== providerPayment.amount || payment.currency !== providerPayment.currency) {
          throw new Error("Captured payment amount differs from the order.");
        }
        if (payment.status !== PaymentStatus.PAID) {
          await transaction.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              razorpayPaymentId: providerPayment.id,
              paidAt: new Date(providerPayment.created_at * 1000),
            },
          });
          await transaction.creditLedger.create({
            data: {
              userId: payment.userId,
              amount: payment.includedImages,
              type: CreditLedgerType.PURCHASE_GRANT,
              referenceId: payment.id,
            },
          });
          await createReceipt(transaction, {
            paymentId: payment.id,
            userId: payment.userId,
            productCode: payment.productCode,
            amountPaise: payment.amountPaise,
            currency: payment.currency,
            paidAt: new Date(providerPayment.created_at * 1000),
            paymentMethod: providerPayment.method ?? null,
          });
        }
      }
    } else if (event.event === "payment.failed" && providerPayment?.order_id) {
      await transaction.payment.updateMany({
        where: { razorpayOrderId: providerPayment.order_id, status: { in: [PaymentStatus.CREATED, PaymentStatus.VERIFIED] } },
        data: { status: PaymentStatus.FAILED },
      });
    } else if (event.event === "subscription.charged" && providerPayment && providerSubscription) {
      if (providerPayment.status !== "captured") throw new Error("Subscription charge is not captured.");
      const subscription = await transaction.planSubscription.findUnique({
        where: { providerSubscriptionId: providerSubscription.id },
        include: { planPrice: true },
      });
      if (subscription?.planPrice) {
        const start = providerSubscription.current_start;
        const end = providerSubscription.current_end;
        if (start == null || end == null || end <= start) throw new Error("Subscription charge has no valid billing period.");
        if (subscription.razorpayPlanId !== providerSubscription.plan_id ||
          subscription.planPrice.priceMinorUnits !== providerPayment.amount ||
          subscription.planPrice.currency !== providerPayment.currency) {
          throw new Error("Subscription charge does not match its price version.");
        }
        const existing = await transaction.payment.findUnique({ where: { razorpayPaymentId: providerPayment.id } });
        if (!existing) {
          const payment = await transaction.payment.create({
            data: {
              userId: subscription.userId,
              productCode: "STUDIO_PRO_MONTHLY",
              billingType: "MONTHLY",
              planPriceId: subscription.planPrice.id,
              subscriptionId: subscription.id,
              razorpaySubscriptionId: providerSubscription.id,
              razorpayPaymentId: providerPayment.id,
              amountPaise: providerPayment.amount,
              currency: providerPayment.currency,
              includedImages: subscription.planPrice.includedImages,
              status: PaymentStatus.PAID,
              paidAt: new Date(providerPayment.created_at * 1000),
            },
          });
          await transaction.subscriptionAllowance.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              providerPaymentId: providerPayment.id,
              periodStart: new Date(start * 1000),
              periodEnd: new Date(end * 1000),
              allowance: subscription.planPrice.includedImages,
            },
          });
          await createReceipt(transaction, {
            paymentId: payment.id,
            userId: payment.userId,
            productCode: payment.productCode,
            amountPaise: payment.amountPaise,
            currency: payment.currency,
            paidAt: new Date(providerPayment.created_at * 1000),
            paymentMethod: providerPayment.method ?? null,
          });
        }
        await transaction.planSubscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(start * 1000),
            currentPeriodEnd: new Date(end * 1000),
          },
        });
      }
    } else if (providerSubscription && LIFECYCLE_STATUS[event.event]) {
      const next = LIFECYCLE_STATUS[event.event];
      if (next) {
        const current = await transaction.planSubscription.findUnique({
          where: { providerSubscriptionId: providerSubscription.id },
          select: { id: true, status: true, razorpayPlanId: true },
        });
        if (current) {
          if (current.razorpayPlanId !== providerSubscription.plan_id) throw new Error("Subscription plan mismatch.");
          if (!(next === SubscriptionStatus.AUTHENTICATED && current.status === SubscriptionStatus.ACTIVE)) {
            await transaction.planSubscription.update({
              where: { id: current.id },
              data: { status: next },
            });
          }
        }
      }
    } else if (event.event.startsWith("refund.") && event.payload.refund?.entity) {
      const refund = event.payload.refund.entity;
      const payment = await transaction.payment.findUnique({ where: { razorpayPaymentId: refund.payment_id } });
      if (payment) {
        await transaction.billingRefund.upsert({
          where: { razorpayRefundId: refund.id },
          create: { paymentId: payment.id, razorpayRefundId: refund.id, amountPaise: refund.amount, status: refund.status },
          update: { status: refund.status },
        });
        const processed = await transaction.billingRefund.aggregate({
          where: { paymentId: payment.id, status: "processed" },
          _sum: { amountPaise: true },
        });
        const amount = processed._sum.amountPaise ?? 0;
        if (amount > 0) {
          await transaction.payment.update({
            where: { id: payment.id },
            data: { status: amount >= payment.amountPaise ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED },
          });
          await transaction.auditLog.create({
            data: {
              action: "BILLING_REFUND_RECONCILIATION_REQUIRED",
              resourceType: "Payment",
              resourceId: payment.id,
              metadata: { refundId: refund.id, amountPaise: refund.amount },
            },
          });
        }
      }
    }

    await transaction.webhookEvent.update({
      where: { provider_externalId: { provider: "RAZORPAY", externalId: eventId } },
      data: { status: WebhookProcessingStatus.PROCESSED, processedAt: new Date() },
    });
  });
}
