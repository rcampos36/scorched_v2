"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Import ReactQuill CSS
import "react-quill/dist/quill.snow.css"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

interface ReactQuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function ReactQuillEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  disabled = false,
}: ReactQuillEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a placeholder during SSR
  if (!mounted) {
    return (
      <div className="h-[300px] border rounded-md p-4 bg-gray-50 flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    )
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      [{ color: [] }, { background: [] }],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image",
    "color",
    "background",
    "blockquote",
    "code-block",
  ]

  return (
    <div className="react-quill-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ minHeight: "300px" }}
      />
    </div>
  )
}
