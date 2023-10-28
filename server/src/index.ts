import * as SocketIO from "socket.io"
import {Connection} from "./game";
import {Actions} from "../../common/client-action"

class Server {
    private server: SocketIO.Server;

    constructor(port: number, corsOrigin: string) {
        this.server = new SocketIO.Server({
            cors: {
                origin: corsOrigin
            }
        });
        this.server.on("connection", Server.initializeSocket);
        this.server.listen(port);
    }

    public exit = () => this.server.close();

    private static initializeSocket(socket: SocketIO.Socket) {
        const con = new Connection((e => {
            console.log(e);
            socket.emit("state", e);
        }), socket.handshake.auth.sessionId);
        socket.on("action", e => {
            console.log(e);
            if (Actions.isActionSetName(e)) {
                con.actionSetName(e.name);
            } else if (Actions.isActionJoinWaitRoom(e)) {
                con.actionJoinWaitRoom(e.roomId, e.players);
            } else if (Actions.isActionSetReadyWaitRoom(e)) {
                con.actionSetReadyWaitRoom(e.ready);
            } else if (Actions.isActionMakeGuess(e)) {
                con.actionMakeGuess(e.guess);
            }
        });
    }
}

const server = new Server(13001, "http://localhost:8080");
//process.on("SIGINT", server.exit);
