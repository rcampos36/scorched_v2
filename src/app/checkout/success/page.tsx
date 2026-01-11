"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Thank you for your order!
            </p>
            {orderId && (
              <p className="text-sm text-gray-500">
                Order Number: <span className="font-semibold">{orderId}</span>
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              A confirmation email has been sent to your email address with your order details.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">View Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Thank you for your order!
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              A confirmation email has been sent to your email address with your order details.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">View Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
