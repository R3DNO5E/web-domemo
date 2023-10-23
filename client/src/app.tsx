import React, {useEffect, useState} from "react";
import {ClientState, ClientStateGameRoom, ClientStateWaitRoom} from "../../common/client-state";
import {Actions} from "../../common/client-action";
import {io, Socket} from "socket.io-client";
import styles from "./main.css"

class Connection {
    private socket: Socket;
    private state: ClientState = {};
    private readonly reportState: (e: ClientState) => void;

    constructor(stateListener: (e: ClientState) => void) {
        this.reportState = stateListener;
        this.stateEventHandler = this.stateEventHandler.bind(this);
        this.actionEmitter = this.actionEmitter.bind(this);
        this.socket = io("ws://localhost:13001", {
            auth: {
                sessionId: sessionStorage.getItem("session_id")
            }
        });
        this.socket.on("state", this.stateEventHandler);
        this.socket.connect();
    }

    private stateEventHandler(e: ClientState) {
        console.log(e);
        if (e == undefined) return;
        if (typeof e == "object" &&
            (this.state.userState == undefined || e.userState.sessionId != this.state.userState.sessionId)) {
            sessionStorage.setItem("session_id", e.userState.sessionId);
        }
        this.state = e;
        this.reportState(this.state);
    }

    public actionEmitter(e: Actions.Actions) {
        console.log(e);
        this.socket.emit("action", e);
    }
}

export function SceneJoinRoom({setName}: { setName: (name: string) => void }) {
    return (<div></div>);
}

export function SceneNewRoom({setName}: { setName: (name: string) => void }) {
    return (<div>
        <div className="scene-title">
            <h2>ようこそ</h2>
            <h3>プレイ人数を選択してゲームを開始します</h3>
        </div>
        <div className="scene-main">
            <div className={styles.select}>
                <button type="button" className={styles.selectItem}>2</button>
            </div>
            <input type="text"/>
        </div>
    </div>);
}

export function SceneWelcome({setName}: { setName: (name: string) => void }) {
    return (<div>
        <p>Welcome</p>
        <form onSubmit={e => {
            e.preventDefault();
            if (typeof e.currentTarget.textName == "object" && typeof e.currentTarget.textName.value == "string") {
                setName(e.currentTarget.textName.value);
            }
        }}>
            <label>What's your name?</label>
            <input type="text" id="textName"/>
            <input type="submit" value="Go"/>
        </form>
    </div>);
}

export function SceneWaitRoom({state, setReady}: {
    state: ClientStateWaitRoom,
    setReady: (ready: boolean) => void
}) {
    const [localReady, setLocalReady] = useState(state.users[0].ready);
    return (<div>
        <p>Matchmaking</p>
        {state.users.map(e => (<p>name:{e.name} is {e.ready ? "ready to go" : "preparing"}</p>))}
        <input type={'button'} value={localReady ? "Ready" : "Preparing"} onClick={() => {
            setLocalReady(!localReady);
            setReady(!localReady);
        }}/>
        <a href={"http://localhost:8080/?roomId=" + state.roomId}>invite link</a>
    </div>);
}

export function SceneGameRoom({state, makeGuess}: { state: ClientStateGameRoom, makeGuess: (guess: number) => void }) {
    return (<div>
        <p>Game</p>
        {state.users.map(e => (<div>
            <div>Name: {e.name}</div>
            <div>Cards: {e.cards.map(e => (
                <div><p>Value:{e.value}</p><p>Open:{e.open ? "open" : "close"}</p></div>))}</div>
        </div>))}
    </div>);
}

export function App({urlParams}: { urlParams: { [p: string]: string } }) {
    const [state, setState] = useState<ClientState>({});
    const [conn, setConn] = useState<Connection>();
    useEffect(() => {
        if (conn == undefined) {
            const t = new Connection(setState)
            setConn(t);
            t.actionEmitter({
                action: "JoinWaitRoom",
                roomId: urlParams.roomId
            });
        }
    });

    function setName(name: string) {
        conn.actionEmitter({
            action: "SetName",
            name: name
        });
    }

    function setReady(ready: boolean) {
        conn.actionEmitter({
            action: "SetReadyWaitRoom",
            ready: ready
        });
    }

    function makeGuess(guess: number) {
        conn.actionEmitter({
            action: "MakeGuess",
            guess: guess
        });
    }

    if (state.waitRoomState == undefined) {
        return (<div>Connecting...</div>);
    } else if (state.userState.userName == "") {
        if (state.waitRoomState.users.length == 1) {
            return (<SceneNewRoom setName={setName}/>);
        } else {
            return (<SceneJoinRoom setName={setName}/>);
        }
    } else if (state.gameRoomState == undefined) {
        return (<div><SceneWaitRoom state={state.waitRoomState} setReady={setReady}/></div>);
    } else {
        return (<div><SceneGameRoom state={state.gameRoomState} makeGuess={makeGuess}/></div>);
    }
}
