export interface Transporter {
  id: string
  name: string
  kind: 'propio' | 'externo'
}

export interface Truck {
  id: string
  plate: string
  transporterId: string
  /** Plain string — no separate Driver entity for this demo. */
  driver?: string
}
