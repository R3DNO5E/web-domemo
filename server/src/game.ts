import * as crypto from "crypto"

interface ClientStateUser {
    userName: string
}

interface ClientStateWaitRoom {
    roomId: string,
    numPlayer: number,
    users: {
        name: string,
        ready: boolean
    }[]
}

interface ClientStateGameRoom {
    users: {
        name: string,
        cards: {
            value: number,
            open: boolean
        }[]
    }[],
    openCards: number[],
    turn: number
}


interface ClientState {
    sessionId: string,
    userState?: ClientStateUser,
    waitRoomState?: ClientStateWaitRoom,
    gameRoomState?: ClientStateGameRoom
}

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

    constructor(reporter: (e: Object) => void, sessionId?: string) {
        this.stateReporter = reporter;
        this.renderState = this.renderState.bind(this);
        this.notifyChange = this.notifyChange.bind(this);
        this.actionSetName = this.actionSetName.bind(this);
        this.actionJoinWaitRoom = this.actionJoinWaitRoom.bind(this);
        this.actionSetReadyWaitRoom = this.actionSetReadyWaitRoom.bind(this);
        this.actionMakeGuess = this.actionMakeGuess.bind(this);
        if (sessionId == undefined || User.findById(sessionId) == undefined) {
            this.user = new User("", this.notifyChange);
        } else {
            this.user = User.findById(sessionId);
        }
        this.notifyChange();
    }

    public renderState(): ClientState {
        if (this.user == undefined) {
            return;
        }
        const r: ClientState = {
            sessionId: this.user.getSessionId(),
        };
        r.userState = this.user.renderState();
        const waitRoom = WaitRoom.findByUser(this.user);
        const gameRoom = GameRoom.findByUser(this.user);
        if (waitRoom != undefined) {
            r.waitRoomState = waitRoom.renderState();
        }
        if (gameRoom != undefined) {
            r.gameRoomState = gameRoom.renderState(this.user);
        }
        return r;
    }

    private notifyChange() {
        this.stateReporter(this.renderState());
    }

    public actionSetName(name: string) {
        this.user.setName(name);
        if (WaitRoom.findByUser(this.user) != undefined) {
            WaitRoom.findByUser(this.user).notifyChange();
        }
        if (GameRoom.findByUser(this.user) != undefined) {
            GameRoom.findByUser(this.user).notifyChange();
        }
    }

    public actionJoinWaitRoom(roomId?: string) {
        if (WaitRoom.findByUser(this.user) != undefined) {
            WaitRoom.findByUser(this.user).leaveRoom(this.user);
        }

        if (roomId != undefined && WaitRoom.findById(roomId) != undefined) {
            WaitRoom.findById(roomId).joinRoom(this.user);
        } else {
            (new WaitRoom()).joinRoom(this.user);
        }
    }

    public actionSetReadyWaitRoom(ready: boolean) {
        if (WaitRoom.findByUser(this.user) == undefined) {
            return;
        }
        WaitRoom.findByUser(this.user).setReady(this.user, ready);
    }

    public actionMakeGuess(guess: number) {
        if (GameRoom.findByUser(this.user) == undefined) {
            return;
        }
        GameRoom.findByUser(this.user).makeGuess(this.user, guess);
    }
}

class User extends IdentifiedById {
    private static readonly indexer: IndexerId<User> = new IndexerId<User>();
    private name: string;
    private readonly listener: (() => void);

    constructor(name: string, listener: () => void) {
        super();
        this.listener = listener;
        User.indexer.add(this);
        this.setName(name);
        this.renderState = this.renderState.bind(this);
    }

    public notifyChange = () => {
        this.listener();
    }

    public getSessionId = () => this.id;
    public static findById = (id: string) => User.indexer.get(id);

    public setName = (name: string) => {
        this.name = name;
        this.notifyChange();
    };

    public getName = () => this.name;

    public renderState(): ClientStateUser {
        return {
            userName: this.name
        };
    }
}

class WaitRoom extends IdentifiedById {
    private static readonly indexer: IndexerId<WaitRoom> = new IndexerId<WaitRoom>();
    private static readonly userIndex: Map<User, WaitRoom> = new Map<User, WaitRoom>();
    private readonly maxPlayer = 2;
    private users: Set<User> = new Set<User>();
    private ready: Map<User, boolean> = new Map<User, boolean>();

    constructor() {
        super();
        WaitRoom.indexer.add(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.setReady = this.setReady.bind(this);
        this.renderState = this.renderState.bind(this);
    }

    public notifyChange = () => this.users.forEach(e => e.notifyChange());

    joinRoom(user: User) {
        if (this.users.size < this.maxPlayer) {
            this.users.add(user);
            WaitRoom.userIndex.set(user, this);
        }
        this.notifyChange();
    }

    leaveRoom(user: User) {
        this.users.delete(user);
        this.ready.delete(user);
        WaitRoom.userIndex.delete(user);
        if (this.users.size == 0) {
            WaitRoom.indexer.del(this.id);
        }
        user.notifyChange();
        this.notifyChange();
    }

    setReady(user: User, ready: boolean) {
        this.ready.set(user, ready);
        let allReady = true;
        this.users.forEach(e => {
            if (this.ready.has(e) == false || this.ready.get(e) == false) {
                allReady = false;
            }
        });
        if (allReady) {
            this.ready.clear();
            new GameRoom(Array.from(this.users));
        }
        this.notifyChange();
    }

    static findByUser(user: User) {
        return WaitRoom.userIndex.get(user);
    }

    static findById(id: string) {
        return WaitRoom.indexer.get(id);
    }

    public getId = () => this.id;

    public renderState(): ClientStateWaitRoom {
        return {
            numPlayer: this.maxPlayer,
            roomId: this.id,
            users: Array.from(this.users).map(e => ({
                name: e.getName(),
                ready: this.ready.has(e) ? this.ready.get(e) : false
            }))
        };
    }
}

class GameRoom {
    private static readonly userIndex: Map<User, GameRoom> = new Map<User, GameRoom>();
    private users: {
        user: User,
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
        this.users = users.map((v, i) => ({
            user: v,
            cards: c.players[i].map(e => ({value: e, open: false}))
        }));
        this.openCards = c.open;
        this.turn = 0;
        this.makeGuess = this.makeGuess.bind(this);
        this.renderState = this.renderState.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.notifyChange();
    }

    public notifyChange = () => this.users.forEach(e => e.user.notifyChange());

    leaveRoom(user: User) {
        GameRoom.userIndex.delete(user);
        user.notifyChange();
        this.notifyChange();
    }

    makeGuess(user: User, card: number) {
        if (this.users[this.turn].user !== user) {
            return;
        }
        const c = this.users[this.turn].cards;
        this.turn++;
        const t = Array.from(c.entries()).filter(e => e[1].value == card && e[1].open == false).map(e => e[0]);
        if (t.length == 0) {
            return;
        }
        c[t[GameRoom.randomInt(0, t.length)]].open = true;
        this.notifyChange();
        return;
    }

    static findByUser(user: User) {
        return GameRoom.userIndex.get(user);
    }

    public renderState(user: User): ClientStateGameRoom {
        return {
            turn: this.turn,
            users: this.users.map(e => ({
                name: e.user.getName(),
                cards: e.user != user ? e.cards :
                    e.cards.map(c => ({
                        value: c.open ? c.value : 0,
                        open: c.open
                    }))
            })),
            openCards: this.openCards
        };
    }
}
