export function isLLMConfidenceHigh(clientInfo, threshold = 0.8) {
  if (!clientInfo) return false;
  return clientInfo.type === 'LLM' && clientInfo.confidence >= threshold;
}

export function isConvertiblePayload(data) {
  if (data === null || data === undefined) return false;
  if (Buffer.isBuffer(data)) return false;
  return typeof data === 'object';
}

export function wantsToonResponse(headers = {}) {
  const accept = String(headers.accept || headers.Accept || '').toLowerCase();
  const toonHeader = headers['x-accept-toon'] === 'true';
  return accept.includes('toon') || toonHeader;
}

export function isToonContentType(headers = {}) {
  const contentType = String(headers['content-type'] || '').toLowerCase();
  return contentType.includes('text/plain') || contentType.includes('application/toon');
}

