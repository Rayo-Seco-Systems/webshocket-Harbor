const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

server.listen(80, () => {
    console.log("Signal Server listening on port 80");
});

app.get("/", (req, res) => res.send('Signal Server Running!'));

const webSocket = require("ws");
const wss = new webSocket.Server({ server });

let clientIdCounter = 0;

wss.on("connection", function (socket, req) {
    if (wss.clients.size > 2) {
        console.warn("[LIMIT] Too many clients. Rejecting new connection.");
        socket.close();
        return;
    }

    const clientId = ++clientIdCounter;
    const ip = req.socket.remoteAddress;

    console.log(`[CONNECT] Client #${clientId} connected from IP ${ip}`);

    socket.on("message", function (msg) {
        console.log(`[RECEIVE] Client #${clientId} sent raw: ${msg}`);

        let parsed = null;

        try {
            parsed = JSON.parse(msg);
            console.log(`[PARSED] Message type: ${parsed?.type}, from: ${parsed?.from}, to: ${parsed?.to}`);
        } catch (err) {
            console.warn(`[WARNING] Client #${clientId} sent a non-JSON or invalid message. Ignored.`);
            return;
        }

        wss.clients.forEach(function (client) {
            if (client !== socket && client.readyState === webSocket.OPEN) {
                try {
                    console.log(`[FORWARD] Relaying message from Client #${clientId} to another client`);
                    client.send(msg);
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