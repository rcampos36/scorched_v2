"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminRegister() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [hasAdmins, setHasAdmins] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if any admins exist (open registration if none)
      const adminsResponse = await fetch("/api/auth/admins")
      
      if (!adminsResponse.ok) {
        // If error, allow open registration (file might not exist yet)
        setHasAdmins(false)
        setAuthenticated(true)
        setCheckingAuth(false)
        return
      }

      const adminsData = await adminsResponse.json()
      
      if (adminsData.admins && adminsData.admins.length === 0) {
        // No admins exist, allow open registration
        setHasAdmins(false)
        setAuthenticated(true) // Set to true so form shows
        setCheckingAuth(false)
        return
      }

      // Admins exist, check authentication
      setHasAdmins(true)
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      setAuthenticated(data.authenticated)
      if (!data.authenticated) {
        // Redirect to login after a moment
        setTimeout(() => {
          router.push("/admin/login")
        }, 2000)
      }
    } catch (error) {
      // If error fetching, allow open registration (safer for first-time setup)
      setHasAdmins(false)
      setAuthenticated(true)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validation
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create admin")
        return
      }

      setSuccess(true)
      setUsername("")
      setPassword("")
      setConfirmPassword("")
      
      // Redirect based on whether this was first admin or not
      if (!hasAdmins) {
        // First admin - redirect to login so they can log in
        setTimeout(() => {
          router.push("/admin/login")
        }, 2000)
      } else {
        // Additional admin - redirect to dashboard
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 2000)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (hasAdmins && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must be logged in to register new admins.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Redirecting to login...</p>
            <Link href="/admin/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{hasAdmins ? "Register New Admin" : "Create First Admin"}</CardTitle>
          <CardDescription>
            {hasAdmins 
              ? "Create a new admin account to manage the hero slider"
              : "Create the first admin account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading || success}
                placeholder="Enter username (min. 3 characters)"
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                placeholder="Enter password (min. 6 characters)"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success}
                placeholder="Confirm password"
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                Admin created successfully! Redirecting to dashboard...
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading || success}>
                {loading ? "Creating..." : success ? "Created!" : hasAdmins ? "Register Admin" : "Create Admin"}
              </Button>
              {hasAdmins && (
                <Link href="/admin/dashboard">
                  <Button type="button" variant="outline" disabled={loading || success}>
                    Cancel
                  </Button>
                </Link>
              )}
              {!hasAdmins && (
                <Link href="/admin/login">
                  <Button type="button" variant="outline" disabled={loading || success}>
                    Cancel
                  </Button>
                </Link>
              )}
            </div>
            {success && !hasAdmins && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Redirecting to login page...
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
