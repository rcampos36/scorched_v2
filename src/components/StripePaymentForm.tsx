"use client"

import { useState, useEffect } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface StripePaymentFormProps {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  customerData?: {
    email: string
    name: string
    address?: {
      line1: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}

export default function StripePaymentForm({
  amount,
  onSuccess,
  onError,
  customerData,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: customerData
              ? {
                  name: customerData.name,
                  email: customerData.email,
                  address: customerData.address,
                }
              : undefined,
          },
        },
        redirect: "if_required",
      })

      if (error) {
        setMessage(error.message || "An error occurred")
        onError(error.message || "Payment failed")
        setIsProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id)
      } else {
        setIsProcessing(false)
      }
    } catch (err: any) {
      setMessage(err.message || "An error occurred")
      onError(err.message || "Payment failed")
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {message && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  )
}
