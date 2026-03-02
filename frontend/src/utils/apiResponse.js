/**
 * Normalize API responses to business payloads.
 * Supports standard backend wrapper: { success, data, message, code, timestamp }.
 */
export function unwrapApiResponse(response) {
  const payload = response?.data ?? response
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data
  }
  return payload
}

export default unwrapApiResponse
