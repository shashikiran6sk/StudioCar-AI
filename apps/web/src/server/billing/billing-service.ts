import type { RazorpayEnvironment } from "@studiocar/config";
import type { PrismaClient } from "@studiocar/database-runtime";
import { PaymentStatus } from "@studiocar/database-runtime";
import { PLUS_PRODUCT } from "@studiocar/contracts";
import type { VerifyBillingOrder } from "@studiocar/contracts";

import { RazorpayClient } from "./providers/razorpay/razorpay-client";
import { verifyRazorpaySignature } from "./providers/razorpay/verify-signature";
import { getBillingBusiness } from "./billing-business";

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
    if (!plan || !plan.active || !plan.purchasable || plan.billingInterval !== "ONE_TIME" || plan.currency !== "INR" || plan.priceMinorUnits !== PLUS_PRODUCT.amountPaise || plan.includedImages !== PLUS_PRODUCT.credits) {
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
      select: { id: true, razorpayOrderId: true, razorpayPaymentId: true, status: true },
    });
    if (!payment?.razorpayOrderId) return false;
    if (!verifyRazorpaySignature(
      `${payment.razorpayOrderId}|${input.razorpay_payment_id}`,
      input.razorpay_signature,
      this.environment.RAZORPAY_KEY_SECRET,
    )) return false;
    if (payment.razorpayPaymentId && payment.razorpayPaymentId !== input.razorpay_payment_id) return false;
    if (payment.status === PaymentStatus.CREATED || payment.status === PaymentStatus.FAILED) {
      await this.database.payment.updateMany({
        where: { id: payment.id, status: { in: [PaymentStatus.CREATED, PaymentStatus.FAILED] } },
        data: { status: PaymentStatus.VERIFIED },
      });
    }
    return true;
  }

}
