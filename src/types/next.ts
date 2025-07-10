export interface NextApiResponseServerIO extends Response {
  socket: {
    server: {
      io?: unknown;
    };
  };
}
