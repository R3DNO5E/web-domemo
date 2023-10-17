import * as SocketIO from "socket.io"
import * as crypto from "crypto"

interface IdentifiableById {
    getId: () => string;
}

class User implements IdentifiableById {
    private name?: string;
    private sessionId: string = crypto.randomUUID();
    private waitRoom?: WaitRoom;

    constructor() {
        this.getId = this.getId.bind(this);
        this.setWaitRoom = this.setWaitRoom.bind(this);
    }

    getId() {
        return this.sessionId;
    }

    setWaitRoom(waitRoom: WaitRoom) {
        this.waitRoom = waitRoom;
    }
}

class WaitRoom implements IdentifiableById {
    private readonly maxPlayer = 2;
    private id: string = crypto.randomUUID();
    private users: Set<User> = new Set<User>();
    private ready: Map<User, boolean> = new Map<User, boolean>();

    constructor() {
        this.getId = this.getId.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.setReady = this.setReady.bind(this);
    }

    getId() {
        return this.id;
    }

    joinRoom(user: User) {
        if (this.users.size < this.maxPlayer) {
            this.users.add(user);
            user.setWaitRoom(this);
        }
    }

    setReady(user: User, ready: boolean) {
        this.ready.set(user, ready);
    }
}

interface GameRoom2 {
    users: User[],
    cards: {
        value: number,
        open: boolean
    }[][]
    turn: number,
}

class GameRoom {
    private users: User[] = [];
    private cards = new Map<User, {
        value: number,
        open: boolean
    }[]>();

}

interface ClientBaseState {
    state: "connected" | "registered" | "matching" | "game",
    sessionId: string
    userState?: {
        userName: string
    },
    waitRoomState?: {
        inviteUrl: string,
        numPlayer: number,
        users: {
            name: string,
            ready: boolean
        }
    },
    gameRoomState?: {
        users: {
            name: string,
            cards: {
                value: number,
                open: boolean
            }[]
        },
        turn: 0 | 1 | 2 | 3
    }
}

class IdIndexer<T extends IdentifiableById> {
    private readonly index: Map<string, T> = new Map<string, T>();

    constructor() {
        this.add = this.add.bind(this);
        this.get = this.get.bind(this);
    }

    add(e: T) {
        this.index.set(e.getId(), e);
    }

    get(id: string): T {
        return this.index.get(id);
    }
}
