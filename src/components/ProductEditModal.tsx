"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ProductCard {
  id: number
  image: string
  title: string
  description: string
  price?: number
  graphic?: string
}

interface ProductEditModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductCard | null
  onSave: (product: ProductCard) => void
  onImageUpload?: (file: File) => Promise<string>
}

export default function ProductEditModal({
  isOpen,
  onClose,
  product,
  onSave,
  onImageUpload,
}: ProductEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<ProductCard | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingGraphic, setUploadingGraphic] = useState(false)

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product })
    }
  }, [product, isOpen])

  if (!isOpen || !editedProduct) return null

  const handleChange = (field: keyof ProductCard, value: string | number) => {
    setEditedProduct({ ...editedProduct, [field]: value })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageUpload) return

    setUploading(true)
    try {
      const imageUrl = await onImageUpload(file)
      handleChange("image", imageUrl)
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleGraphicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageUpload) return

    setUploadingGraphic(true)
    try {
      const imageUrl = await onImageUpload(file)
      handleChange("graphic", imageUrl)
    } catch (error) {
      console.error("Failed to upload graphic:", error)
      alert("Failed to upload graphic/logo. Please try again.")
    } finally {
      setUploadingGraphic(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleSave = () => {
    if (!editedProduct.image || !editedProduct.title || !editedProduct.description) {
      alert("Please fill in all required fields (image, title, description)")
      return
    }
    onSave(editedProduct)
    onClose()
  }

  const handleRemoveImage = () => {
    handleChange("image", "")
  }

  const handleRemoveGraphic = () => {
    handleChange("graphic", "")
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold">Edit Product</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image Section */}
            <div className="space-y-2">
              <Label htmlFor="product-image">Product Image *</Label>
              <div className="space-y-2">
                {/* Image Preview */}
                {editedProduct.image && (
                  <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                    {editedProduct.image.startsWith('/uploads/') ? (
                      <img
                        src={editedProduct.image}
                        alt="Product preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={editedProduct.image}
                        alt="Product preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={75}
                      />
                    )}
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <label
                    htmlFor="file-upload-product-modal"
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                      uploading
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {uploading ? "Uploading..." : "Upload Image"}
                    </span>
                    <input
                      id="file-upload-product-modal"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* URL Input */}
                <div className="relative">
                  <Input
                    id="product-image"
                    value={editedProduct.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    placeholder="Or enter image URL (https://example.com/image.jpg)"
                    disabled={uploading}
                  />
                  {editedProduct.image && (
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload an image (max 10MB) or paste an image URL
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="product-title">Title *</Label>
              <Input
                id="product-title"
                value={editedProduct.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Product title (e.g., HOODIES)"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="product-description">Description *</Label>
              <Textarea
                id="product-description"
                value={editedProduct.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description"
                rows={3}
              />
            </div>

            {/* Price (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (Optional)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                value={editedProduct.price || ""}
                onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                placeholder="29.99"
              />
              <p className="text-xs text-gray-500">
                Optional: Product price (used for display purposes)
              </p>
            </div>

            {/* Graphic/Logo Section */}
            <div className="space-y-2 border-t pt-6">
              <Label htmlFor="product-graphic">Graphic/Logo Image (Optional)</Label>
              <p className="text-xs text-gray-600 mb-3">
                Upload a high-quality graphic, logo, or design that will be applied to this product. 
                Accepted formats: <strong>JPEG, PNG, WebP, GIF</strong>. 
                Maximum file size: <strong>10MB</strong>. 
                For best results, use high-resolution images (300 DPI or higher).
              </p>
              <div className="space-y-2">
                {/* Graphic Preview */}
                {editedProduct.graphic && (
                  <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                    {editedProduct.graphic.startsWith('/uploads/') ? (
                      <img
                        src={editedProduct.graphic}
                        alt="Graphic/Logo preview"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    ) : (
                      <Image
                        src={editedProduct.graphic}
                        alt="Graphic/Logo preview"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={95}
                      />
                    )}
                    <button
                      onClick={handleRemoveGraphic}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <label
                    htmlFor="file-upload-graphic-modal"
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                      uploadingGraphic
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {uploadingGraphic ? "Uploading..." : "Upload Graphic/Logo"}
                    </span>
                    <input
                      id="file-upload-graphic-modal"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleGraphicFileChange}
                      disabled={uploadingGraphic}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* URL Input */}
                <div className="relative">
                  <Input
                    id="product-graphic"
                    value={editedProduct.graphic || ""}
                    onChange={(e) => handleChange("graphic", e.target.value)}
                    placeholder="Or enter graphic/logo URL (https://example.com/logo.png)"
                    disabled={uploadingGraphic}
                  />
                  {editedProduct.graphic && (
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload a graphic/logo image (max 10MB) or paste an image URL. Recommended: PNG with transparent background for logos.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t sticky bottom-0 bg-white">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
