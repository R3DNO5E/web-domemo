import * as SocketIO from "socket.io"
import {Connection} from "./game";

namespace Actions {
    export interface ActionSetName {
        action: "SetName",
        name: string
    }

    export interface ActionJoinWaitRoom {
        action: "JoinWaitRoom",
        roomId?: string
    }

    export interface ActionSetReadyWaitRoom {
        action: "SetReadyWaitRoom",
        ready: boolean
    }

    export interface ActionMakeGuess {
        action: "MakeGuess",
        guess: number
    }

    export type Actions = ActionSetName | ActionJoinWaitRoom | ActionSetReadyWaitRoom | ActionMakeGuess;

    export function isActionSetName(e: any): e is ActionSetName {
        return typeof (e) == "object" && e.action == "SetName" && typeof (e.name) == "string";
    }

    export function isActionJoinWaitRoom(e: any): e is ActionJoinWaitRoom {
        return typeof (e) == "object" && e.action == "JoinWaitRoom" && (typeof (e.roomId) == "string" || typeof (e.roomId) == "undefined");
    }

    export function isActionSetReadyWaitRoom(e: any): e is ActionSetReadyWaitRoom {
        return typeof (e) == "object" && e.action == "SetReadyWaitRoom" && typeof (e.ready) == "boolean";
    }

    export function isActionMakeGuess(e: any): e is ActionMakeGuess {
        return typeof (e) == "object" && e.action == "MakeGuess" && typeof (e.guess) == "number";
    }

    export function isAction(e: any): e is Actions {
        return isActionSetName(e) || isActionJoinWaitRoom(e) || isActionSetReadyWaitRoom(e) || isActionMakeGuess(e);
    }
}

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
            socket.emit("status", e);
        }), socket.handshake.auth.sessionId);
        socket.on("action", e => {
            if (Actions.isActionSetName(e)) {
                con.actionSetName(e.name);
            } else if (Actions.isActionJoinWaitRoom(e)) {
                con.actionJoinWaitRoom(e.roomId);
            } else if (Actions.isActionSetReadyWaitRoom(e)) {
                con.actionSetReadyWaitRoom(e.ready);
            } else if (Actions.isActionMakeGuess(e)) {
                con.actionMakeGuess(e.guess);
            }
        });
    }
}

const server = new Server(13001, "http://localhost:13000");
process.on("SIGINT", server.exit);

/*
const t1 = new Connection(e => console.log("1 :" + JSON.stringify(e)));
const t2 = new Connection(e => console.log("2 :" + JSON.stringify(e)));
t1.actionSetName("t1");
t2.actionSetName("t2");
t1.actionJoinWaitRoom();
const roomId = t1.renderState().waitRoomState.roomId;
t2.actionJoinWaitRoom(roomId);
t1.actionJoinWaitRoom();
*/
