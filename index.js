const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

server.listen(80, '0.0.0.0', () => {
    console.log("Signal Server listening on port 80");
});

app.get("/", (req, res) => res.send('Signal Server Running!'));

const webSocket = require("ws");
const wss = new webSocket.Server({ 
    server,
    path: "/shocket",
    clientTracking: true,
    keepAlive: true,
    noServer: false
});

let clientIdCounter = 0;

wss.on("connection", function (socket, req) {

    const clientId = ++clientIdCounter;
    const ip = req.socket.remoteAddress;

    console.log(`[CONNECT] Client #${clientId} connected from IP ${ip}`);
    console.log(`[CONNECT] Headers:`, req.headers);

    socket.on("message", function (msg) {
        console.log(`[RECEIVE] Client #${clientId} sent raw: ${msg}`);

        let parsed = null;

        try {
            socket.ping();
            console.log(`[PING] Sent ping to Client #${clientId}`);
        } catch (err) {
            console.error(`[PING-ERROR] Failed to ping Client #${clientId}:`, err.message || err);
        }

        wss.clients.forEach(function (client) {
            if (client !== socket && client.readyState === webSocket.OPEN) {
                try {
                    console.log(`[FORWARD] Relaying message from Client #${clientId} to another client`);
                    console.log(`[FORWARD] About to send message to client...`);
                    client.send(msg);
                    console.log(`[FORWARD] Message sent to client.`);
                } catch (err) {
                    console.error(`[ERROR] Failed to forward to another client:`, err.message || err);
                }
            }
        });
    });

    socket.on("close", function () {
        console.log(`[DISCONNECT] Client #${clientId} disconnected`);
    });

    socket.on("error", function (err) {
        console.error(`[ERROR] Client #${clientId}:`, err.message || err);
    });
});

process.on("uncaughtException", function (err) {
    console.error("[FATAL] Uncaught exception:", err.message || err);
});