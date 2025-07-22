const fs = require("fs");
const https = require("https");
const express = require("express");
const WebSocket = require("ws");

const app = express();

const server = https.createServer({
    cert: fs.readFileSync("./ssl/cert.pem"),
    key: fs.readFileSync("./ssl/key.pem")
}, app);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`HTTPS + WSS server running on port ${PORT}`);
});

app.get("/", (req, res) => res.send("Secure WebSocket Signaling Server OK."));

const wss = new WebSocket.Server({ server });

wss.on("connection", function (socket) {
    console.log("New client connected");

    socket.on("message", function (msg) {
        console.log("Message from client:", msg);

        // Broadcast to all other clients
        wss.clients.forEach(function (client) {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    });

    socket.on("close", function () {
        console.log("Client disconnected");
    });
});
