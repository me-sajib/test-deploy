import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db } from "@/db/drizzle"
import { subscriptions } from "@/db/schema"
import { getPayPalAccessToken } from "@/lib/paypal"

const paypalWebhook = new Hono().post("/", async (c) => {
	const payload = await c.req.json()
	const webhookEvent = payload

	// Verify the webhook signature (in production, you should implement proper verification)
	// This is a simplified version

	try {
		// Handle different event types
		if (webhookEvent.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
			const subscriptionId = webhookEvent.resource.id

			// Get subscription details from PayPal
			const accessToken = await getPayPalAccessToken()
			const response = await fetch(`${process.env.NODE_ENV === "production"
				? "https://api-m.paypal.com"
				: "https://api-m.sandbox.paypal.com"}/v1/billing/subscriptions/${subscriptionId}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})

			const subscription = await response.json()

			// Update subscription status in database
			await db
				.update(subscriptions)
				.set({
					status: "ACTIVE",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.subscriptionId, subscriptionId))
		}

		if (webhookEvent.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
			const subscriptionId = webhookEvent.resource.id

			// Update subscription status in database
			await db
				.update(subscriptions)
				.set({
					status: "CANCELLED",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.subscriptionId, subscriptionId))
		}

		if (webhookEvent.event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
			const subscriptionId = webhookEvent.resource.id

			// Update subscription status in database
			await db
				.update(subscriptions)
				.set({
					status: "EXPIRED",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.subscriptionId, subscriptionId))
		}

		if (webhookEvent.event_type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
			const subscriptionId = webhookEvent.resource.id

			// Update subscription status in database
			await db
				.update(subscriptions)
				.set({
					status: "PAYMENT_FAILED",
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.subscriptionId, subscriptionId))
		}

		if (webhookEvent.event_type === "BILLING.SUBSCRIPTION.RENEWED") {
			const subscriptionId = webhookEvent.resource.id

			// Get subscription details from PayPal
			const accessToken = await getPayPalAccessToken()
			const response = await fetch(`${process.env.NODE_ENV === "production"
				? "https://api-m.paypal.com"
				: "https://api-m.sandbox.paypal.com"}/v1/billing/subscriptions/${subscriptionId}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})

			const subscription = await response.json()

			// Update subscription in database
			await db
				.update(subscriptions)
				.set({
					status: subscription.status,
					currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.subscriptionId, subscriptionId))
		}

		return c.json({ received: true })
	} catch (error) {
		console.error("PayPal webhook error:", error)
		return c.json({ error: "Webhook handler failed" }, 500)
	}
})

export default paypalWebhook
