export interface ClientStateUser {
    sessionId: string,
    userName: string
}

export interface ClientStateWaitRoom {
    roomId: string,
    numPlayer: number,
    users: {
        name: string,
        ready: boolean
    }[],
}

export interface ClientStateGameRoom {
    users: {
        name: string,
        cards: {
            value: number,
            open: boolean
        }[],
        winner: number
    }[],
    openCards: number[],
    turn: number,
    you: number
}


export interface ClientState {
    userState?: ClientStateUser,
    waitRoomState?: ClientStateWaitRoom,
    gameRoomState?: ClientStateGameRoom
}