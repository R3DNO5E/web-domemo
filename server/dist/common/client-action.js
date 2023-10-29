"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionResponses = exports.Actions = void 0;
var Actions;
(function (Actions) {
    function isActionSync(e) {
        return typeof (e) == "object" && e.action == "Sync";
    }
    Actions.isActionSync = isActionSync;
    function isActionSetName(e) {
        return typeof (e) == "object" && e.action == "SetName" && typeof (e.name) == "string";
    }
    Actions.isActionSetName = isActionSetName;
    function isActionJoinWaitRoom(e) {
        return typeof (e) == "object" && e.action == "JoinWaitRoom"
            && (typeof (e.roomId) == "string" || typeof (e.roomId) == "undefined")
            && (typeof (e.leaveCurrent) == "boolean" || typeof (e.leaveCurrent) == "undefined");
    }
    Actions.isActionJoinWaitRoom = isActionJoinWaitRoom;
    function isActionSetReadyWaitRoom(e) {
        return typeof (e) == "object" && e.action == "SetReadyWaitRoom" && typeof (e.ready) == "boolean";
    }
    Actions.isActionSetReadyWaitRoom = isActionSetReadyWaitRoom;
    function isActionMakeGuess(e) {
        return typeof (e) == "object" && e.action == "MakeGuess" && typeof (e.guess) == "number";
    }
    Actions.isActionMakeGuess = isActionMakeGuess;
    function isAction(e) {
        return isActionSync(e) || isActionSetName(e) || isActionJoinWaitRoom(e) || isActionSetReadyWaitRoom(e) || isActionMakeGuess(e);
    }
    Actions.isAction = isAction;
})(Actions || (exports.Actions = Actions = {}));
var ActionResponses;
(function (ActionResponses) {
    function isResponseMakeGuess(e) {
        return typeof (e) == "object" && e.response == "MakeGuess";
    }
    ActionResponses.isResponseMakeGuess = isResponseMakeGuess;
    function isResponse(e) {
        return isResponseMakeGuess(e);
    }
    ActionResponses.isResponse = isResponse;
})(ActionResponses || (exports.ActionResponses = ActionResponses = {}));
//# sourceMappingURL=client-action.js.map