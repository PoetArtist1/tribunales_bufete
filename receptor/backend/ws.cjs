/**
 * WebSocket helper para notificar al frontend receptor.
 */

let wss = null;

function setWebSocketServer(server) {
  wss = server;
}

function broadcast(event, payload = {}) {
  if (!wss) return;
  const message = JSON.stringify({ event, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

module.exports = {
  setWebSocketServer,
  broadcast,
};
