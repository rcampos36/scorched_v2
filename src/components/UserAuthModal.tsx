"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function UserAuthModal({ isOpen, onClose, onSuccess }: UserAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  
  // Register form
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerFirstName, setRegisterFirstName] = useState("")
  const [registerLastName, setRegisterLastName] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")

  useEffect(() => {
    if (isOpen) {
      setError("")
      setLoginEmail("")
      setLoginPassword("")
      setRegisterEmail("")
      setRegisterPassword("")
      setRegisterFirstName("")
      setRegisterLastName("")
      setRegisterPhone("")
    }
  }, [isOpen, isLogin])

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid email or password")
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (registerPassword.length < 6) {
        setError("Password must be at least 6 characters")
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          firstName: registerFirstName,
          lastName: registerLastName,
          phone: registerPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create account")
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-firstname">First Name</Label>
                  <Input
                    id="register-firstname"
                    type="text"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="register-lastname">Last Name</Label>
                  <Input
                    id="register-lastname"
                    type="text"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="register-phone">Phone (Optional)</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  className="mt-1"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-500 hover:text-pink-600 font-medium text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
