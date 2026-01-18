"use client"

import { useState, useEffect } from "react"
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface PayPalPaymentFormProps {
  amount: number
  currency?: string
  onSuccess: (orderId: string, transactionId: string) => void
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
  cartItems?: Array<{
    title: string
    price: number
    quantity: number
  }>
}

function PayPalButtonsWrapper({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  customerData,
  cartItems,
}: PayPalPaymentFormProps) {
  const [{ isPending }] = usePayPalScriptReducer()

  const createOrder = async (data: any, actions: any) => {
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          items: cartItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || "Failed to create order"
        console.error("PayPal create order API error:", errorData)
        throw new Error(errorMessage)
      }

      const orderData = await response.json()
      return orderData.orderId
    } catch (error: any) {
      console.error("Create order error:", error)
      onError(error.message || "Failed to create order")
      throw error
    }
  }

  const onApprove = async (data: any, actions: any) => {
    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to capture payment")
      }

      const captureData = await response.json()
      
      if (captureData.success && captureData.transactionId) {
        onSuccess(data.orderID, captureData.transactionId)
      } else {
        throw new Error("Payment capture was not successful")
      }
    } catch (error: any) {
      console.error("Capture error:", error)
      onError(error.message || "Payment failed")
    }
  }

  const onErrorHandler = (err: any) => {
    console.error("PayPal error:", err)
    onError(err.message || "An error occurred with PayPal")
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading PayPal...</span>
      </div>
    )
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onErrorHandler}
      style={{
        layout: "vertical",
        color: "blue",
        shape: "rect",
        label: "paypal",
      }}
    />
  )
}

export default function PayPalPaymentForm(props: PayPalPaymentFormProps) {
  const [paypalConfig, setPaypalConfig] = useState<{ clientId: string; environment: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPayPalConfig = async () => {
      try {
        const response = await fetch("/api/paypal/config")
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || "Failed to load PayPal configuration")
        }

        const data = await response.json()
        setPaypalConfig({
          clientId: data.clientId,
          environment: data.environment || "sandbox",
        })
      } catch (err: any) {
        console.error("Error loading PayPal config:", err)
        const errorMessage = err.message || "Failed to load PayPal"
        console.error("Full error details:", err)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadPayPalConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading payment options...</span>
      </div>
    )
  }

  if (error || !paypalConfig) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200">
        <p className="text-sm font-semibold text-red-800 mb-2">
          {error || "PayPal is not configured. Please contact support."}
        </p>
        {(error?.includes("PAYPAL_CLIENT_ID") || !paypalConfig) && (
          <div className="text-xs text-red-600 space-y-1 mt-2">
            <p className="font-semibold">If you are the site administrator:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Set <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> in your Vercel project settings (build-time variable)</li>
              <li>Set <code className="bg-red-100 px-1 rounded">PAYPAL_CLIENT_SECRET</code> in your Vercel project settings (server-side only, runtime variable)</li>
              <li>Verify the variable names are exactly correct (case-sensitive)</li>
              <li>Redeploy your application in Vercel (required for NEXT_PUBLIC_ variables to take effect)</li>
              <li>Check <code className="bg-red-100 px-1 rounded">/api/debug/env</code> to verify variables are loaded</li>
            </ol>
            <p className="mt-2 italic">Note: NEXT_PUBLIC_ variables are baked into the build at build-time. PAYPAL_CLIENT_SECRET must remain server-side only. Vercel will automatically rebuild when you add environment variables.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalConfig.clientId,
        currency: props.currency || "USD",
        intent: "capture",
      }}
    >
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <PayPalButtonsWrapper {...props} />
        </div>
      </div>
    </PayPalScriptProvider>
  )
}
