import * as SocketIO from "socket.io"
import * as express from "express"
import * as http from "http"
import {Connection} from "./game";
import {Actions} from "../../common/client-action"

class Server {
    private readonly server: SocketIO.Server;
    private readonly app: express.Express;
    private readonly http: http.Server;

    constructor(port: number) {
        this.app = express.default();
        this.app.use(express.static("../client/dist"));

        this.http = http.createServer(this.app);

        this.server = new SocketIO.Server(this.http);
        this.server.on("connection", Server.initializeSocket);

        this.http.listen(port);
    }

    public exit = () => this.server.close();

    private static initializeSocket(socket: SocketIO.Socket) {
        const con = new Connection((e => {
            console.log(e);
            socket.emit("state", e);
        }), (e => {
            console.log(e);
            socket.emit("response", e);
        }), socket.handshake.auth.sessionId);
        socket.on("action", e => {
            console.log(e);
            if (Actions.isActionSync(e)) {
                con.actionSync();
            } else if (Actions.isActionSetName(e)) {
                con.actionSetName(e.name);
            } else if (Actions.isActionJoinWaitRoom(e)) {
                con.actionJoinWaitRoom(e.roomId, e.players, e.leaveCurrent);
            } else if (Actions.isActionSetReadyWaitRoom(e)) {
                con.actionSetReadyWaitRoom(e.ready);
            } else if (Actions.isActionMakeGuess(e)) {
                con.actionMakeGuess(e.guess);
            }
        });
    }
}

const server = new Server(3000);
//process.on("SIGINT", server.exit);
