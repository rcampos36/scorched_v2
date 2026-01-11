"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Package, Calendar, DollarSign, MapPin, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

interface OrderItem {
  id: number
  image: string
  title: string
  description: string
  price: number
  quantity: number
  size?: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  total: number
  orderDate: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  carrier?: string
  shippedDate?: string
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/users/session")
      const data = await response.json()

      if (!data.authenticated || !data.user) {
        router.push("/")
        return
      }

      setUser(data.user)
      fetchOrders()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders/user")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/users/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-gray-600 mt-1">Manage your account and track orders</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Information */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <span className="text-sm font-medium">Name</span>
                  </div>
                  <p className="text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                {user.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                )}
                {(user.address || user.city || user.state) && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Address</span>
                    </div>
                    <p className="text-gray-900">
                      {user.address && <>{user.address}<br /></>}
                      {user.city && user.state && (
                        <>{user.city}, {user.state} {user.zipCode}</>
                      )}
                      {user.country && <><br />{user.country}</>}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order History</h2>
              
              {ordersLoading ? (
                <div className="text-center py-8 text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No orders yet</p>
                  <p className="text-gray-500 text-sm">
                    Start shopping to see your orders here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              Order {order.orderId}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.orderDate)}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${order.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-gray-50 rounded p-2"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                {item.size && <span>Size: {item.size}</span>}
                                <span>•</span>
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>${item.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.trackingNumber && (
                        <div className="pt-3 border-t border-gray-200 space-y-1">
                          {order.carrier && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Carrier:</span> {order.carrier}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Tracking:</span> {order.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
