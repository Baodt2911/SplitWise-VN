export const ackError = (ack: any, code: string, message: string) =>
  ack?.({ ok: false, error: { code, message } });

export const ackSuccess = (ack: any, data?: any) => ack?.({ ok: true, data });
