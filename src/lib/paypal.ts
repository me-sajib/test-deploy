import { PayPalScriptProvider } from "@paypal/react-paypal-js"

// PayPal client configuration
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET!

// PayPal API base URL - use sandbox for development, change to live for production
const PAYPAL_API_URL = process.env.NODE_ENV === "production"
	? "https://api-m.paypal.com"
	: "https://api-m.sandbox.paypal.com"

// Function to get access token for server-side API calls
export async function getPayPalAccessToken() {
	const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64")

	const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${auth}`,
		},
		body: "grant_type=client_credentials",
	})

	const data = await response.json()
	return data.access_token
}

// Function to create a subscription plan in PayPal
export async function createPayPalSubscription(userId: string) {
	const accessToken = await getPayPalAccessToken()

	const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			plan_id: process.env.PAYPAL_PLAN_ID,
			subscriber: {
				name: {
					given_name: "Konfetii",
					surname: "User",
				},
			},
			application_context: {
				brand_name: "Konfetii",
				locale: "en-US",
				shipping_preference: "NO_SHIPPING",
				user_action: "SUBSCRIBE_NOW",
				payment_method: {
					payer_selected: "PAYPAL",
					payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
				},
				return_url: `${process.env.NEXT_PUBLIC_APP_URL}?success=1&provider=paypal`,
				cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?canceled=1&provider=paypal`,
			},
			custom_id: userId,
		}),
	})

	const data = await response.json()
	return data
}

// PayPal script provider options
export const paypalScriptOptions = {
	"client-id": paypalClientId,
	currency: "USD",
	intent: "subscription",
	vault: true,
}

export { PayPalScriptProvider }
