// Server-side helper to broadcast a ticket-changed signal over Socket.IO.
// No-op when no socket server is attached (e.g. tests or a serverless deploy),
// so callers never need to guard. The payload is intentionally just the id —
// clients refetch the data through the authenticated REST endpoints.
export function emitTicketUpdate(ticketId: string): void {
  try {
    const io = (globalThis as any).__io;
    if (io) io.to(`ticket:${ticketId}`).emit("ticket:update", { id: ticketId });
  } catch {
    // ignore — live updates are best-effort
  }
}
