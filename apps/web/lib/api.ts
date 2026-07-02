const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface SubmissionPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  document?: File
}

export async function createSubmission(payload: SubmissionPayload) {
  const formData = new FormData()
  formData.append("firstName", payload.firstName)
  formData.append("lastName", payload.lastName)
  formData.append("email", payload.email)
  formData.append("phone", payload.phone)
  if (payload.document) {
    formData.append("document", payload.document)
  }

  const response = await fetch(`${API_URL}/submissions`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to submit")
  }

  return response.json()
}
