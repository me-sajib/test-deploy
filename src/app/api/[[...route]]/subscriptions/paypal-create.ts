import { Hono } from "hono"
import { verifyAuth } from "@hono/auth-js"
import { createPayPalSubscription } from "@/lib/paypal"

const paypalCreate = new Hono().post("/", verifyAuth(), async (c) => {
	const auth = c.get("authUser")

	if (!auth.token?.id) {
		return c.json({ error: "Unauthorized" }, 401)
	}

	try {
		const subscription = await createPayPalSubscription(auth.token.id)

		if (!subscription || subscription.error) {
			return c.json({ error: "Failed to create PayPal subscription" }, 400)
		}

		return c.json({ data: subscription })
	} catch (error) {
		console.error("PayPal subscription creation error:", error)
		return c.json({ error: "Failed to create PayPal subscription" }, 500)
	}
})

export default paypalCreate
