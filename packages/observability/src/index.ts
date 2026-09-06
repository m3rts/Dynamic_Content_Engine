const TRACE_ID_PATTERN = /^trace_[0-9a-f]{32}$/;

export type TraceContext = {
  traceId: string;
  spanId: string;
};

export function createTraceId(now: Date = new Date()): string {
  const timestamp = now.getTime().toString(16).padStart(12, "0");
  const random = crypto.getRandomValues(new Uint8Array(10));
  const randomHex = [...random].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return `trace_${timestamp}${randomHex}`;
}

export function createSpanId(): string {
  const random = crypto.getRandomValues(new Uint8Array(8));
  return [...random].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createTraceContext(now?: Date): TraceContext {
  return {
    traceId: createTraceId(now),
    spanId: createSpanId(),
  };
}

export function isValidTraceId(traceId: string): boolean {
  return TRACE_ID_PATTERN.test(traceId);
}
