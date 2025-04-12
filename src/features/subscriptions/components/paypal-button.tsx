"use client";

import { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PayPalButtonProps {
	onSuccess?: () => void;
	onError?: () => void;
}

export const PayPalButton = ({ onSuccess, onError }: PayPalButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const session = useSession();
	const router = useRouter();

	const handleCreateSubscription = async () => {
		try {
			setIsLoading(true);

			const response = await fetch("/api/subscriptions/paypal-create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to create subscription");
			}

			return data.data.id; // Return the subscription ID
		} catch (error) {
			console.error("PayPal subscription creation error:", error);
			toast.error("Failed to set up PayPal subscription");
			onError?.();
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const handleApprove = async (data: { subscriptionID: string }) => {
		try {
			setIsLoading(true);

			const response = await fetch("/api/subscriptions/paypal-approve", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					subscriptionId: data.subscriptionID,
				}),
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error || "Failed to approve subscription");
			}

			toast.success("Subscription successful!");
			onSuccess?.();
			router.push("/?success=1");
		} catch (error) {
			console.error("PayPal subscription approval error:", error);
			toast.error("Failed to complete subscription");
			onError?.();
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<PayPalButtons
			style={{
				color: "blue",
				shape: "rect",
				label: "subscribe",
				height: 40,
			}}
			disabled={isLoading || session.status !== "authenticated"}
			createSubscription={handleCreateSubscription}
			onApprove={handleApprove}
			onError={() => {
				toast.error("PayPal encountered an error");
				onError?.();
			}}
			onCancel={() => {
				toast.info("Payment cancelled");
			}}
		/>
	);
};
