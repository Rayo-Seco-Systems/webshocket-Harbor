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
    const clientId = ++clientIdCounter;
    const ip = req.socket.remoteAddress;

    console.log(`[CONNECT] Client #${clientId} connected from IP ${ip}`);

    socket.on("message", function (msg) {
        console.log(`[RECEIVE] Client #${clientId} sent: ${msg}`);
        
        // Broadcast that message to all connected clients except sender
        wss.clients.forEach(function (client) {
            if (client !== socket && client.readyState === webSocket.OPEN) {
                console.log(`[FORWARD] Sending message from Client #${clientId} to another client`);
                client.send(msg);
            }
        });
    });

    socket.on("close", function () {
        console.log(`[DISCONNECT] Client #${clientId} disconnected`);
    });

    socket.on("error", function (err) {
        console.error(`[ERROR] Client #${clientId}:`, err);
    });
});