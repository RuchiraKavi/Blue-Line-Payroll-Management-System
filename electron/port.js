import net from "node:net";
import { SERVER_HOST, SERVER_PORT } from "./paths.js";

export function isPortAvailable(port, host = SERVER_HOST) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export async function assertPortAvailable(port, host = SERVER_HOST) {
  const available = await isPortAvailable(port, host);
  if (available) return;

  throw new Error(
    `Port ${port} is already in use on ${host}.\n\n` +
      "Close any other Payroll Management windows, stop the dev backend (npm start), " +
      "then try again.\n\n" +
      "To find what is using the port, run in PowerShell:\n" +
      `  netstat -ano | findstr :${port}`
  );
}

export { SERVER_PORT as DEFAULT_SERVER_PORT };
