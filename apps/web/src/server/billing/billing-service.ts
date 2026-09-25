import type { RazorpayEnvironment } from "@studiocar/config";
import type { PrismaClient } from "@studiocar/database-runtime";
import { PaymentStatus, SubscriptionSource, SubscriptionStatus } from "@studiocar/database-runtime";
import type { VerifyBillingOrder, VerifyBillingSubscription } from "@studiocar/contracts";

import { RazorpayClient } from "./providers/razorpay/razorpay-client";
import { verifyRazorpaySignature } from "./providers/razorpay/verify-signature";
import { getBillingBusiness } from "./billing-business";

const OPEN_SUBSCRIPTION_STATES = [
  SubscriptionStatus.CREATED,
  SubscriptionStatus.AUTHENTICATED,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PENDING,
  SubscriptionStatus.PAUSED,
  SubscriptionStatus.HALTED,
  SubscriptionStatus.PAST_DUE,
];

export class BillingService {
  private readonly provider: RazorpayClient;

  public constructor(
    private readonly database: PrismaClient,
    private readonly environment: RazorpayEnvironment,
  ) {
    this.provider = new RazorpayClient(environment);
  }

  public async createOrder(userId: string) {
    const business = await this.database.$transaction(getBillingBusiness);
    if (business.gstRegistered) throw new Error("GST invoicing must be configured before checkout.");
    const plan = await this.database.planConfig.findUnique({ where: { planKey: "STUDIO_PLUS" } });
    if (!plan || !plan.active || !plan.purchasable || plan.billingInterval !== "ONE_TIME" || plan.currency !== "INR") {
      throw new Error("Studio Plus is unavailable.");
    }
    const payment = await this.database.payment.create({
      data: {
        userId,
        productCode: plan.planKey,
        billingType: plan.billingInterval,
        amountPaise: plan.priceMinorUnits,
        currency: plan.currency,
        includedImages: plan.includedImages,
      },
    });
    const order = await this.provider.createOrder({
      amount: payment.amountPaise,
      currency: payment.currency,
      receipt: payment.id,
      userId,
    });
    await this.database.payment.update({
      where: { id: payment.id },
      data: { razorpayOrderId: order.id },
    });
    return {
      orderId: order.id,
      keyId: this.environment.RAZORPAY_KEY_ID,
      amount: payment.amountPaise,
      currency: payment.currency,
      name: plan.displayName,
    };
  }

  public async verifyOrder(userId: string, input: VerifyBillingOrder): Promise<boolean> {
    const payment = await this.database.payment.findFirst({
      where: { userId, razorpayOrderId: input.razorpay_order_id },
      select: { id: true, razorpayOrderId: true, status: true },
    });
    if (!payment?.razorpayOrderId) return false;
    if (!verifyRazorpaySignature(
      `${payment.razorpayOrderId}|${input.razorpay_payment_id}`,
      input.razorpay_signature,
      this.environment.RAZORPAY_KEY_SECRET,
    )) return false;
    if (payment.status === PaymentStatus.CREATED) {
      await this.database.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.VERIFIED, razorpayPaymentId: input.razorpay_payment_id },
      });
    }
    return true;
  }

  public async createSubscription(userId: string) {
    const business = await this.database.$transaction(getBillingBusiness);
    if (business.gstRegistered) throw new Error("GST invoicing must be configured before checkout.");
    const plan = await this.database.planConfig.findUnique({ where: { planKey: "STUDIO_PRO" } });
    if (!plan || !plan.active || !plan.purchasable || plan.billingInterval !== "MONTHLY" || plan.currency !== "INR") {
      throw new Error("Studio Pro is unavailable.");
    }
    const price = await this.database.planPrice.findUnique({
      where: { planConfigId_environment_priceMinorUnits_includedImages: {
        planConfigId: plan.id,
        environment: this.environment.APP_ENV,
        priceMinorUnits: plan.priceMinorUnits,
        includedImages: plan.includedImages,
      } },
    });
    if (!price) throw new Error("Studio Pro Razorpay plan has not been provisioned for this price.");

    const attempt = await this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`billing-subscription:${userId}`}, 0))`;
      const existing = await transaction.planSubscription.findFirst({
        where: { userId, source: SubscriptionSource.PAYMENT_PROVIDER, status: { in: OPEN_SUBSCRIPTION_STATES } },
        select: { id: true, providerSubscriptionId: true },
      });
      if (existing) return { id: existing.id, providerSubscriptionId: existing.providerSubscriptionId, created: false };
      const now = new Date();
      const pendingEnd = new Date(now.getTime() + 15 * 60_000);
      const created = await transaction.planSubscription.create({
        data: {
          userId,
          source: SubscriptionSource.PAYMENT_PROVIDER,
          provider: "RAZORPAY",
          planKey: plan.planKey,
          planPriceId: price.id,
          razorpayPlanId: price.razorpayPlanId,
          status: SubscriptionStatus.CREATED,
          currentPeriodStart: now,
          currentPeriodEnd: pendingEnd,
        },
        select: { id: true },
      });
      return { id: created.id, providerSubscriptionId: null, created: true };
    });
    if (!attempt.created && !attempt.providerSubscriptionId) throw new Error("Subscription creation is in progress. Try again shortly.");
    if (attempt.providerSubscriptionId) return {
      subscriptionId: attempt.providerSubscriptionId,
      keyId: this.environment.RAZORPAY_KEY_ID,
      amount: price.priceMinorUnits,
      currency: price.currency,
      name: plan.displayName,
    };

    try {
      const remote = await this.provider.createSubscription({
        planId: price.razorpayPlanId,
        userId,
        subscriptionId: attempt.id,
      });
      if (remote.plan_id !== price.razorpayPlanId) throw new Error("Razorpay returned a different plan.");
      await this.database.planSubscription.update({
        where: { id: attempt.id },
        data: { providerSubscriptionId: remote.id },
      });
      return {
        subscriptionId: remote.id,
        keyId: this.environment.RAZORPAY_KEY_ID,
        amount: price.priceMinorUnits,
        currency: price.currency,
        name: plan.displayName,
      };
    } catch (error) {
      // A timeout may have occurred after Razorpay created the subscription.
      // Keep the local attempt so a signed webhook can attach its provider ID.
      throw error;
    }
  }

  public async verifySubscription(userId: string, input: VerifyBillingSubscription): Promise<boolean> {
    const subscription = await this.database.planSubscription.findFirst({
      where: { userId, providerSubscriptionId: input.razorpay_subscription_id, source: SubscriptionSource.PAYMENT_PROVIDER },
      select: { providerSubscriptionId: true },
    });
    if (!subscription?.providerSubscriptionId) return false;
    return verifyRazorpaySignature(
      `${input.razorpay_payment_id}|${subscription.providerSubscriptionId}`,
      input.razorpay_signature,
      this.environment.RAZORPAY_KEY_SECRET,
    );
  }

  public async cancelSubscription(userId: string): Promise<boolean> {
    const subscription = await this.database.planSubscription.findFirst({
      where: { userId, source: SubscriptionSource.PAYMENT_PROVIDER, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING, SubscriptionStatus.HALTED] } },
      select: { id: true, providerSubscriptionId: true, cancelAtPeriodEnd: true },
    });
    if (!subscription?.providerSubscriptionId) return false;
    if (!subscription.cancelAtPeriodEnd) {
      await this.provider.cancelSubscription(subscription.providerSubscriptionId);
      await this.database.planSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    }
    return true;
  }
}
