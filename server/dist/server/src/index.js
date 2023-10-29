"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var SocketIO = __importStar(require("socket.io"));
var express = __importStar(require("express"));
var http = __importStar(require("http"));
var game_1 = require("./game");
var client_action_1 = require("../../common/client-action");
var Server = /** @class */ (function () {
    function Server(port) {
        var _this = this;
        this.exit = function () { return _this.server.close(); };
        this.app = express.default();
        this.app.use(express.static("../client/dist"));
        this.http = http.createServer(this.app);
        this.server = new SocketIO.Server(this.http);
        this.server.on("connection", Server.initializeSocket);
        this.http.listen(port);
    }
    Server.initializeSocket = function (socket) {
        var con = new game_1.Connection((function (e) {
            console.log(e);
            socket.emit("state", e);
        }), (function (e) {
            console.log(e);
            socket.emit("response", e);
        }), socket.handshake.auth.sessionId);
        socket.on("action", function (e) {
            console.log(e);
            if (client_action_1.Actions.isActionSync(e)) {
                con.actionSync();
            }
            else if (client_action_1.Actions.isActionSetName(e)) {
                con.actionSetName(e.name);
            }
            else if (client_action_1.Actions.isActionJoinWaitRoom(e)) {
                con.actionJoinWaitRoom(e.roomId, e.players, e.leaveCurrent);
            }
            else if (client_action_1.Actions.isActionSetReadyWaitRoom(e)) {
                con.actionSetReadyWaitRoom(e.ready);
            }
            else if (client_action_1.Actions.isActionMakeGuess(e)) {
                con.actionMakeGuess(e.guess);
            }
        });
    };
    return Server;
}());
var server = new Server(3000);
//process.on("SIGINT", server.exit);
//# sourceMappingURL=index.js.map