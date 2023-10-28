import * as crypto from "crypto"
import {ClientState, ClientStateUser, ClientStateGameRoom, ClientStateWaitRoom} from "../../common/client-state";
import {ActionResponses} from "../../common/client-action";

class IdentifiedById {
    public readonly id: string = crypto.randomUUID();
}

class IndexerId<T extends IdentifiedById> {
    private readonly index: Map<string, T> = new Map<string, T>();
    public add = (e: T) => this.index.set(e.id, e);
    public get = (id: string) => this.index.get(id);

    public del = (id: string) => this.index.delete(id);
}

export class Connection {
    private readonly user: User;
    //private clientState: ClientState;
    private readonly stateReporter: (e: Object) => void;
    private readonly responseReporter: (e: Object) => void;

    constructor(reporter: (e: Object) => void, responseReporter: (e: Object) => void, sessionId?: string) {
        this.stateReporter = reporter;
        this.responseReporter = responseReporter;
        this.renderState = this.renderState.bind(this);
        this.notifyChange = this.notifyChange.bind(this);
        this.actionSync = this.actionSync.bind(this);
        this.actionSetName = this.actionSetName.bind(this);
        this.actionJoinWaitRoom = this.actionJoinWaitRoom.bind(this);
        this.actionSetReadyWaitRoom = this.actionSetReadyWaitRoom.bind(this);
        this.actionMakeGuess = this.actionMakeGuess.bind(this);
        if (sessionId == undefined || User.findById(sessionId) == undefined) {
            this.user = new User("", this.notifyChange);
        } else {
            this.user = User.findById(sessionId);
            this.user.addListener(this.notifyChange);
        }
        this.notifyChange();
    }

    public renderState(): ClientState {
        if (this.user == undefined) {
            return;
        }
        const r: ClientState = {
            userState: this.user.renderState()
        };
        const waitRoom = WaitRoom.findByUser(this.user);
        const gameRoom = GameRoom.findByUser(this.user);
        if (waitRoom != undefined) {
            r.waitRoomState = waitRoom.renderState(this.user);
        }
        if (gameRoom != undefined) {
            r.gameRoomState = gameRoom.renderState(this.user);
        }
        return r;
    }

    private notifyChange() {
        this.stateReporter(this.renderState());
    }

    public actionSync() {
        this.user.notifyChange();
    }

    public actionSetName(name: string) {
        this.user.setName(name);
        this.user.notifyChange();
        const a = GameRoom.findByUser(this.user);
        if (a != undefined) a.notifyChange();
        const b = WaitRoom.findByUser(this.user);
        if (b != undefined) b.notifyChange();
    }

    public actionJoinWaitRoom(roomId?: string, players?: number, leaveCurrent?: boolean) {
        if (GameRoom.findByUser(this.user) != undefined) {
            if (leaveCurrent === true) {
                const room = GameRoom.findByUser(this.user);
                room.leaveRoom(this.user);
                room.notifyChange();
            } else {
                return;
            }
        }

        if (WaitRoom.findByUser(this.user) != undefined) {
            if (leaveCurrent === true) {
                const room = WaitRoom.findByUser(this.user);
                room.leaveRoom(this.user);
                room.notifyChange();
            } else {
                return;
            }
        }

        if (roomId != undefined && WaitRoom.findById(roomId) != undefined) {
            let room = WaitRoom.findById(roomId);
            if (!room.joinRoom(this.user)) {
                room = new WaitRoom(players);
                room.joinRoom(this.user);
            }
            room.notifyChange();
        } else {
            const room = new WaitRoom(players);
            room.joinRoom(this.user);
            room.notifyChange();
        }
    }

    public actionSetReadyWaitRoom(ready: boolean) {
        if (WaitRoom.findByUser(this.user) == undefined) {
            return;
        }
        const room = WaitRoom.findByUser(this.user);
        room.setReady(this.user, ready);
        room.notifyChange();
    }

    public actionMakeGuess(guess: number) {
        if (GameRoom.findByUser(this.user) == undefined) {
            return;
        }
        const room = GameRoom.findByUser(this.user);
        const t: ActionResponses.ResponseMakeGuess = {
            response: "MakeGuess",
            success: room.makeGuess(this.user, guess)
        }
        this.responseReporter(t);
        room.notifyChange();
    }
}

class User extends IdentifiedById {
    private static readonly indexer: IndexerId<User> = new IndexerId<User>();
    private name: string;
    private readonly listener: (() => void)[] = [];

    constructor(name: string, listener: () => void) {
        super();
        this.listener.push(listener);
        User.indexer.add(this);
        this.setName(name);
        this.renderState = this.renderState.bind(this);
    }

    public addListener = (listener: () => void) => this.listener.push(listener);


    public notifyChange = () => {
        this.listener.forEach(e => e());
    }

    public getSessionId = () => this.id;
    public static findById = (id: string) => User.indexer.get(id);

    public setName = (name: string) => {
        this.name = name;
    };

    public getName = () => this.name;

    public renderState(): ClientStateUser {
        return {
            sessionId: this.getSessionId(),
            userName: this.name
        };
    }
}

class WaitRoom extends IdentifiedById {
    private static readonly indexer: IndexerId<WaitRoom> = new IndexerId<WaitRoom>();
    private static readonly userIndex: Map<User, WaitRoom> = new Map<User, WaitRoom>();
    private readonly maxPlayer: number = 2;
    private users: Set<User> = new Set<User>();
    private ready: Map<User, boolean> = new Map<User, boolean>();

    constructor(playerCount: number = 2) {
        super();
        if ([2, 3, 4, 5].find(e => e == playerCount) != undefined) {
            this.maxPlayer = playerCount;
        } else {
            this.maxPlayer = 2;
        }
        WaitRoom.indexer.add(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.setReady = this.setReady.bind(this);
        this.renderState = this.renderState.bind(this);
    }

    public notifyChange = () => this.users.forEach(e => e.notifyChange());

    joinRoom(user: User): boolean {
        if (this.users.has(user)) {
            return true;
        }
        if (this.users.size < this.maxPlayer) {
            this.users.add(user);
            WaitRoom.userIndex.set(user, this);
            return true;
        }
        return false;
    }

    leaveRoom(user: User) {
        this.users.delete(user);
        this.ready.delete(user);
        WaitRoom.userIndex.delete(user);
        if (this.users.size == 0) {
            WaitRoom.indexer.del(this.id);
        }
    }

    setReady(user: User, ready: boolean) {
        this.ready.set(user, ready);
        let allReady = this.users.size == this.maxPlayer;
        this.users.forEach(e => {
            if (this.ready.has(e) == false || this.ready.get(e) == false) {
                allReady = false;
            }
        });
        if (allReady) {
            this.ready.clear();
            new GameRoom(Array.from(this.users));
        }
    }

    static findByUser(user: User) {
        return WaitRoom.userIndex.get(user);
    }

    static findById(id: string) {
        return WaitRoom.indexer.get(id);
    }

    public getId = () => this.id;

    public renderState(user: User): ClientStateWaitRoom {
        const usersArray = Array.from(this.users);
        let usersSorted = usersArray.sort((a: User, b: User) => {
            if (a == b) return 0;
            if (a == user) return 1;
            if (b == user) return -1;
            return a.id > b.id ? 1 : -1;
        });
        return {
            numPlayer: this.maxPlayer,
            roomId: this.getId(),
            users: usersSorted.map(e => ({
                name: e.getName(),
                ready: this.ready.has(e) ? this.ready.get(e) : false
            }))
        };
    }
}

class GameRoom {
    private static readonly userIndex: Map<User, GameRoom> = new Map<User, GameRoom>();
    private readonly users: {
        user: User,
        winner: number,
        cards: {
            value: number,
            open: boolean
        }[]
    }[];
    private readonly openCards: number[]
    private turn: number;

    private static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    private static distributeCards(players: number): { players: number[][], open: number[] } {
        const cardCounts: { [index: number]: { players: number, open: number } } = {
            2: {players: 7, open: 7},
            3: {players: 7, open: 0},
            4: {players: 5, open: 4},
            5: {players: 4, open: 4},
        };

        const cards = []
        for (let i = 1; i <= 7; i++) {
            for (let j = 1; j <= i; j++) {
                cards.push(i);
            }
        }

        for (let i = 0; i < cards.length; i++) {
            const j = GameRoom.randomInt(i, cards.length);
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        const r: { players: number[][], open: number[] } = {
            players: [],
            open: []
        }

        for (let i = 0; i < players; i++) {
            r.players.push(cards.splice(0, cardCounts[players].players));
        }
        r.open = cards.splice(0, cardCounts[players].open);

        return r;
    }

    constructor(users: User[]) {
        users.forEach(e => GameRoom.userIndex.set(e, this));
        const c = GameRoom.distributeCards(users.length);
        this.users = users.sort((a, b) => {
            if (a == b) return 0;
            else if (a.id > b.id) return 1;
            else return -1;
        }).map((v, i) => ({
            user: v,
            winner: 0,
            cards: c.players[i].map(e => ({value: e, open: false}))
        }));
        this.openCards = c.open;
        this.turn = 0;
        this.makeGuess = this.makeGuess.bind(this);
        this.renderState = this.renderState.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
    }

    public notifyChange = () => this.users.forEach(e => e.user.notifyChange());

    leaveRoom(user: User) {
        GameRoom.userIndex.delete(user);
    }

    makeGuess(user: User, card: number): boolean {
        if (this.users[this.turn].user !== user) {
            return false;
        }
        const u = this.users[this.turn];
        const c = this.users[this.turn].cards;
        let nextUserOffset = 1;
        while (nextUserOffset < this.users.length &&
        this.users[(this.turn + nextUserOffset) % this.users.length].winner != 0) {
            nextUserOffset++;
        }
        this.turn = (this.turn + nextUserOffset) % this.users.length;
        const t = Array.from(c.entries()).filter(e => e[1].value == card && e[1].open == false).map(e => e[0]);
        if (t.length == 0) {
            return false;
        }
        c[t[GameRoom.randomInt(0, t.length)]].open = true;
        if (c.filter(e => !e.open).length == 0) {
            u.winner = this.users.filter(e => e.winner != 0).length + 1;
        }
        return true;
    }

    static findByUser(user: User) {
        return GameRoom.userIndex.get(user);
    }

    public renderState(user: User): ClientStateGameRoom {
        return {
            turn: this.turn,
            you: this.users.findIndex(e => e.user == user),
            users: this.users.map(e => ({
                name: e.user.getName(),
                winner: e.winner,
                cards: e.user != user ? e.cards :
                    e.cards.map(c => ({
                        value: c.open ? c.value : 0,
                        open: c.open
                    }))
            })),
            openCards: this.openCards,
        };
    }
}
