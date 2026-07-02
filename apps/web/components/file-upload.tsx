"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  onChange?: (files: File[]) => void
}

export function FileUpload({ accept, multiple = true, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected)
    onChange?.(selected)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </Button>
      {files.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1">
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
