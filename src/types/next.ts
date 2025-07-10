export interface NextApiResponseServerIO extends Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: {
    server: {
      io?: unknown;
    };
  };
}
