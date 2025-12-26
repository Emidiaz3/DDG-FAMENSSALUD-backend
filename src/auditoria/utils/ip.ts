export function getClientIp(req: any): string | null {
  const xff = req?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();

  // distintos frameworks/adapters pueden exponerlo distinto
  if (typeof req?.ip === 'string' && req.ip) return req.ip;
  if (typeof req?.connection?.remoteAddress === 'string')
    return req.connection.remoteAddress;
  if (typeof req?.socket?.remoteAddress === 'string')
    return req.socket.remoteAddress;
  if (typeof req?.raw?.socket?.remoteAddress === 'string')
    return req.raw.socket.remoteAddress;

  return null;
}
