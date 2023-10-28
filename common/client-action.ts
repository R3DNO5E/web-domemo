export namespace Actions {
    export interface ActionSync {
        action: "Sync"
    }

    export interface ActionSetName {
        action: "SetName",
        name: string
    }

    export interface ActionJoinWaitRoom {
        action: "JoinWaitRoom",
        leaveCurrent?: boolean,
        roomId?: string,
        players?: number
    }

    export interface ActionSetReadyWaitRoom {
        action: "SetReadyWaitRoom",
        ready: boolean
    }

    export interface ActionMakeGuess {
        action: "MakeGuess",
        guess: number
    }

    export type Actions = ActionSync | ActionSetName | ActionJoinWaitRoom | ActionSetReadyWaitRoom | ActionMakeGuess;

    export function isActionSync(e: any): e is ActionSync {
        return typeof (e) == "object" && e.action == "Sync";
    }

    export function isActionSetName(e: any): e is ActionSetName {
        return typeof (e) == "object" && e.action == "SetName" && typeof (e.name) == "string";
    }

    export function isActionJoinWaitRoom(e: any): e is ActionJoinWaitRoom {
        return typeof (e) == "object" && e.action == "JoinWaitRoom"
            && (typeof (e.roomId) == "string" || typeof (e.roomId) == "undefined")
            && (typeof (e.leaveCurrent) == "boolean" || typeof (e.leaveCurrent) == "undefined");
    }

    export function isActionSetReadyWaitRoom(e: any): e is ActionSetReadyWaitRoom {
        return typeof (e) == "object" && e.action == "SetReadyWaitRoom" && typeof (e.ready) == "boolean";
    }

    export function isActionMakeGuess(e: any): e is ActionMakeGuess {
        return typeof (e) == "object" && e.action == "MakeGuess" && typeof (e.guess) == "number";
    }

    export function isAction(e: any): e is Actions {
        return isActionSync(e) || isActionSetName(e) || isActionJoinWaitRoom(e) || isActionSetReadyWaitRoom(e) || isActionMakeGuess(e);
    }
}

export namespace ActionResponses {
    export interface ResponseMakeGuess {
        response: "MakeGuess",
        success: boolean
    }

    export type Responses = ResponseMakeGuess;

    export function isResponseMakeGuess(e: any): e is ResponseMakeGuess {
        return typeof (e) == "object" && e.response == "MakeGuess";
    }

    export function isResponse(e: any): e is Responses {
        return isResponseMakeGuess(e);
    }
}
