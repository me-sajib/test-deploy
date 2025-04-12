import { z } from "zod"
import { Hono } from "hono"
import { verifyAuth } from "@hono/auth-js"
import { zValidator } from "@hono/zod-validator"
import { getPayPalAccessToken } from "@/lib/paypal"
import { db } from "@/db/drizzle"
import { subscriptions } from "@/db/schema"

const paypalApprove = new Hono().post(
	"/",
	verifyAuth(),
	zValidator(
		"json",
		z.object({
			subscriptionId: z.string(),
		})
	),
	async (c) => {
		const auth = c.get("authUser")
		const { subscriptionId } = c.req.valid("json")

		if (!auth.token?.id) {
			return c.json({ error: "Unauthorized" }, 401)
		}

		try {
			// Get subscription details from PayPal
			const accessToken = await getPayPalAccessToken()
			const response = await fetch(`${process.env.NODE_ENV === "production"
				? "https://api-m.paypal.com"
				: "https://api-m.sandbox.paypal.com"}/v1/billing/subscriptions/${subscriptionId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			})

			const subscription = await response.json()

			if (!response.ok || subscription.error) {
				return c.json({ error: "Failed to verify PayPal subscription" }, 400)
			}

			// Save subscription to database
			await db.insert(subscriptions).values({
				userId: auth.token.id,
				subscriptionId: subscription.id,
				customerId: subscription.subscriber.payer_id,
				priceId: subscription.plan_id,
				status: subscription.status,
				currentPeriodEnd: new Date(subscription.billing_info.next_billing_time),
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			return c.json({ success: true })
		} catch (error) {
			console.error("PayPal subscription approval error:", error)
			return c.json({ error: "Failed to process PayPal subscription" }, 500)
		}
	}
)

export default paypalApprove
