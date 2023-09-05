const WebSocket = require("ws");

const ws = new WebSocket(
	"ws://bootstrap.production.bacalhau.org:1234/requester/websocket/events?jobID=b088a14f-ab8d-4854-8b4e-7d20e11a4948"
);

ws.on("error", console.error);

ws.on("open", function open() {
	ws.send("something");
});

ws.on("message", function message(data) {
	console.log("received: %s", data);
});
