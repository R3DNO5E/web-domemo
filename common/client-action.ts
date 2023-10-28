export namespace Actions {
    export interface ActionSetName {
        action: "SetName",
        name: string
    }

    export interface ActionJoinWaitRoom {
        action: "JoinWaitRoom",
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