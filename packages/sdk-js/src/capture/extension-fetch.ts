/**
 * Optional fetch transport for Chrome extension background proxy
 * (bypasses mixed-content when an HTTPS page calls an HTTP dev API).
 */

export type CaptureFetchTransport = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

let transport: CaptureFetchTransport | null = null;

export function setCaptureFetchTransport(next: CaptureFetchTransport | null) {
  transport = next;
}

export function getCaptureFetchTransport(): CaptureFetchTransport | null {
  return transport;
}

export async function fetchViaCaptureTransport(
  input: string,
  init: RequestInit,
): Promise<Response> {
  if (transport) {
    return transport(input, init);
  }
  return fetch(input, init);
}
