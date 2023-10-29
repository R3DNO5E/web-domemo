import React, {useEffect, useState, useRef} from "react";
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
        this.socket = io({
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
    const [name, setInputName] = useState("");
    return (<div>
        <div className={styles.sceneTitle}>
            <h2>ゲームに参加</h2>
            <h3>招待されたゲームに参加します</h3>
        </div>
        <div className={styles.sceneMain}>
            <input type="text" placeholder="表示名を入力してください"
                   className={styles.textInput}
                   onChange={e => setInputName(e.currentTarget.value)}/>
            <button type="submit" onClick={e => {
                e.preventDefault();
                setName(name);
            }}>開始
            </button>
        </div>
    </div>);
}

export function SceneNewRoom({setName, newRoom}: {
    setName: (name: string) => void,
    newRoom: (players: number) => void
}) {
    const [players, setPlayers] = useState(2);
    const [name, setInputName] = useState("");
    return (<div>
        <div className={styles.sceneTitle}>
            <h2>ようこそ</h2>
            <h3>プレイ人数を選択してゲームを開始します</h3>
        </div>
        <div className={styles.sceneMain}>
            <div className={styles.select}>
                {[2, 3, 4, 5].map(v => (
                    <button type={"button"}
                            className={styles.selectItem + " " + (v == players ? styles.selectItemActive : "")}
                            onClick={e => {
                                e.preventDefault();
                                setPlayers(v);
                            }}>{v}</button>
                ))}
            </div>
            <input type="text" placeholder="表示名を入力してください"
                   className={styles.textInput}
                   onChange={e => setInputName(e.currentTarget.value)}/>
            <button type="submit" onClick={e => {
                e.preventDefault();
                newRoom(players);
                setName(name);
            }}>開始
            </button>
        </div>
    </div>);
}

export function SceneWaitRoom({state, setReady, leaveRoom}: {
    state: ClientStateWaitRoom,
    setReady: (ready: boolean) => void,
    leaveRoom: () => void
}) {
    const [localReady, setLocalReady] = useState(state.users[0].ready);
    return (<div>
        <div className={styles.sceneTitle}>
            <h2>マッチメイキング</h2>
            <h3>他のプレイヤーの参加を待っています</h3>
        </div>
        <div className={styles.sceneMain}>
            {state.users.map(e => (
                <div className={styles.waitRoomPlayer}>
                    <div className={styles.waitRoomPlayerName}>{e.name}</div>
                    {e.ready ? <div className={styles.waitRoomPlayerReady}>準備完了</div> :
                        <div className={styles.waitRoomPlayerNotReady}>準備中</div>}
                </div>
            ))}
            <button type="button" onClick={(e) => {
                e.preventDefault();
                setLocalReady(!localReady);
                setReady(!localReady);
            }}>{localReady ? "準備完了" : "準備中"}</button>
            <button type="button" onClick={e => {
                e.preventDefault();
                navigator.clipboard.writeText("https://domemo.rxd.jp/?roomId=" + state.roomId)
                    .then(e => alert("コピーしました"));
            }}>招待リンクをコピー
            </button>
            <button type="button" onClick={e => {
                e.preventDefault();
                leaveRoom();
            }}>ゲームを退出
            </button>
        </div>
    </div>);
}

export function SceneGameRoom({state, makeGuess, leaveGame}: {
    state: ClientStateGameRoom,
    makeGuess: (guess: number) => void,
    leaveGame: () => void
}) {
    const [select, setSelect] = useState(1);
    return (<div>
        {state.users[state.you].winner != 0 ?
            <div className={styles.sceneTitle}>
                <h2>ゲーム終了</h2>
                <h3>相手のプレイを観戦しています</h3>
            </div> :
            <div className={styles.sceneTitle}>
                <h2>{state.turn == state.you ? "あなたのターン" : "相手のターン"}</h2>
                <h3>{state.turn == state.you ? "カードの数字を推測して選択します" : "推測の決定を待っています"}</h3>
            </div>}
        <div className={styles.sceneMain}>
            {state.users[state.you].winner == 0 ?
                <div className={styles.gameRoomControls}>
                    <div className={styles.select}>
                        {[1, 2, 3, 4, 5, 6, 7].map(v => (
                            <button type={"button"}
                                    className={styles.selectItem + " " + (v == select ? styles.selectItemActive : "")}
                                    onClick={e => {
                                        e.preventDefault();
                                        setSelect(v);
                                    }}>{v}</button>
                        ))}
                    </div>
                    <button type="button"
                            className={state.turn == state.you ? "" : styles.buttonNotAvailable}
                            onClick={(e) => {
                                e.preventDefault();
                                if (state.you == state.turn) {
                                    makeGuess(select);
                                }
                            }}>{state.turn == state.you ? "決定" : "あなたのターンではありません"}</button>
                </div> : <div className={styles.gameRoomControls}>
                    <button type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                leaveGame();
                            }}>
                        ゲームを退出
                    </button>
                </div>}
            <div className={styles.gameRoomPlayers}>
                <div className={styles.gameRoomPlayer}>
                    <div className={styles.gameRoomPlayerName}>公開カード</div>
                    <div className={styles.gameRoomPlayerCards}>
                        {state.openCards.map(e => (<div className={styles.gameRoomPlayerCard}>{e}</div>))}
                    </div>
                </div>
                {state.users.map((e, i) => (
                    <div className={styles.gameRoomPlayer}>
                        <div className={styles.gameRoomPlayerName}>{e.name + (i == state.you ? "(あなた)" : "")}</div>
                        <div className={styles.gameRoomPlayerCards}>
                            {e.cards.map(e => (
                                <div
                                    className={styles.gameRoomPlayerCard + " " + (e.open ? styles.gameRoomPlayerCardOpen : "")}>
                                    {e.value == 0 ? '?' : e.value}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.gameRoomResults}>
                {state.users.filter(e => e.winner != 0)
                    .sort((a, b) => a.winner - b.winner)
                    .map(e => (<div className={styles.gameRoomResult}>
                        <div className={styles.gameRoomResultRank}>{e.winner + "位"}</div>
                        <div className={styles.gameRoomResultName}>{e.name}</div>
                    </div>))}
            </div>
        </div>
    </div>);
}

export function App({urlParams}: { urlParams: { [p: string]: string } }) {
    const [state, setState] = useState<ClientState>({});
    const [conn, setConn] = useState<Connection>();
    const messages = useRef<string[]>([]);
    const [overlayMessage, setOverlayMessage] = useState<string[]>([]);
    useEffect(() => {
        if (conn == undefined) {
            const t = new Connection(setState);
            setConn(t);
            t.actionEmitter({
                action: "JoinWaitRoom",
                roomId: urlParams.roomId
            });
        }
    });

    function joinRoom(roomId?: string, playerCount?: number) {
        conn.actionEmitter({
            action: "JoinWaitRoom",
            roomId: roomId,
            players: playerCount,
            leaveCurrent: true
        });
    }

    function setName(name: string) {
        conn.actionEmitter({
            action: "SetName",
            name: name
        });
    }

    function newRoom(players: number) {
        joinRoom(undefined, players);
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

    function leaveGame() {
        joinRoom(state.waitRoomState.roomId,undefined);
    }

    function leaveRoom() {
        joinRoom(undefined, undefined);
        setName("");
    }

    function showMessage(msg: string) {
        messages.current.unshift(msg);
        setOverlayMessage(Array.from(messages.current));
        setTimeout(e => {
            messages.current.pop();
            setOverlayMessage(Array.from(messages.current));
        }, 5000);
    }

    let scene = <div></div>;

    if (state.waitRoomState == undefined) {
        scene = <div>Connecting...</div>;
    } else if (state.userState.userName == "") {
        if (state.waitRoomState.users.length == 1) {
            scene = (<SceneNewRoom setName={setName} newRoom={newRoom}/>);
        } else {
            scene = (<SceneJoinRoom setName={setName}/>);
        }
    } else if (state.gameRoomState == undefined) {
        scene = (<SceneWaitRoom state={state.waitRoomState} setReady={setReady} leaveRoom={leaveRoom}/>);
    } else {
        scene = (<SceneGameRoom state={state.gameRoomState} makeGuess={makeGuess} leaveGame={leaveGame}/>);
    }
    return (<div className={styles.appRoot}>
        <div className={styles.overlay}>
            {overlayMessage.map(e => (<div className={styles.overlayMessage}>{e}</div>))}
        </div>
        {scene}
    </div>);
}
