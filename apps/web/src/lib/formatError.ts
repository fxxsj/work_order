import { getHttpErrorMessage } from './http'

export function formatError(err: any, fallback: string) {
  return getHttpErrorMessage(err, fallback)
}

