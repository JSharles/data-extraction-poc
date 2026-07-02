import { SubmissionForm } from "@/components/submission-form"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          New submission
        </h1>
        <SubmissionForm />
      </div>
    </div>
  )
}
