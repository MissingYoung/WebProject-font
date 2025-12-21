export type ResultErrorPayload = {
  code: number
  message: string
  bizCode?: string | null
  data?: unknown
}

export type ApiError = Error & {
  code?: number
  bizCode?: string
  data?: unknown
}

export const createApiError = (payload: ResultErrorPayload): ApiError => {
  const err = new Error(payload.message) as ApiError
  err.code = payload.code
  if (payload.bizCode) err.bizCode = payload.bizCode
  err.data = payload.data
  return err
}

export const isApiError = (err: unknown): err is ApiError => {
  return err instanceof Error && ('bizCode' in err || 'code' in err)
}
