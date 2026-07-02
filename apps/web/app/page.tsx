import { ContactForm } from "@/components/contact-form"
import { FileUpload } from "@/components/file-upload"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm dark:bg-zinc-900 space-y-8">
        <div>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Contact information</h1>
          <ContactForm />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Upload documents</h2>
          <FileUpload accept=".pdf,.docx,.xlsx" />
        </div>
      </div>
    </div>
  )
}
