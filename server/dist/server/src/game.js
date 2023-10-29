"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
var crypto = __importStar(require("crypto"));
var IdentifiedById = /** @class */ (function () {
    function IdentifiedById() {
        this.id = crypto.randomUUID();
    }
    return IdentifiedById;
}());
var IndexerId = /** @class */ (function () {
    function IndexerId() {
        var _this = this;
        this.index = new Map();
        this.add = function (e) { return _this.index.set(e.id, e); };
        this.get = function (id) { return _this.index.get(id); };
        this.del = function (id) { return _this.index.delete(id); };
    }
    return IndexerId;
}());
var Connection = /** @class */ (function () {
    function Connection(reporter, responseReporter, sessionId) {
        this.stateReporter = reporter;
        this.responseReporter = responseReporter;
        this.renderState = this.renderState.bind(this);
        this.notifyChange = this.notifyChange.bind(this);
        this.actionSync = this.actionSync.bind(this);
        this.actionSetName = this.actionSetName.bind(this);
        this.actionJoinWaitRoom = this.actionJoinWaitRoom.bind(this);
        this.actionSetReadyWaitRoom = this.actionSetReadyWaitRoom.bind(this);
        this.actionMakeGuess = this.actionMakeGuess.bind(this);
        if (sessionId == undefined) {
            this.user = new User("", this.notifyChange);
        }
        else {
            var t = User.findById(sessionId);
            this.user = (t == undefined ? new User("", this.notifyChange) : t);
            this.user.addListener(this.notifyChange);
        }
        this.notifyChange();
    }
    Connection.prototype.renderState = function () {
        if (this.user == undefined) {
            return {};
        }
        var r = {
            userState: this.user.renderState()
        };
        var waitRoom = WaitRoom.findByUser(this.user);
        var gameRoom = GameRoom.findByUser(this.user);
        if (waitRoom != undefined) {
            r.waitRoomState = waitRoom.renderState(this.user);
        }
        if (gameRoom != undefined) {
            r.gameRoomState = gameRoom.renderState(this.user);
        }
        return r;
    };
    Connection.prototype.notifyChange = function () {
        this.stateReporter(this.renderState());
    };
    Connection.prototype.actionSync = function () {
        this.user.notifyChange();
    };
    Connection.prototype.actionSetName = function (name) {
        this.user.setName(name);
        this.user.notifyChange();
        var a = GameRoom.findByUser(this.user);
        if (a != undefined)
            a.notifyChange();
        var b = WaitRoom.findByUser(this.user);
        if (b != undefined)
            b.notifyChange();
    };
    Connection.prototype.actionJoinWaitRoom = function (roomId, players, leaveCurrent) {
        var g = GameRoom.findByUser(this.user);
        if (g != undefined) {
            if (leaveCurrent === true) {
                g.leaveRoom(this.user);
                g.notifyChange();
            }
            else {
                return;
            }
        }
        var w = WaitRoom.findByUser(this.user);
        if (w != undefined) {
            if (leaveCurrent === true) {
                w.leaveRoom(this.user);
                w.notifyChange();
            }
            else {
                return;
            }
        }
        if (roomId != undefined) {
            var room = WaitRoom.findById(roomId);
            if (room == undefined) {
                room = new WaitRoom(players);
                room.joinRoom(this.user);
            }
            else if (!room.joinRoom(this.user)) {
                room = new WaitRoom(players);
                room.joinRoom(this.user);
            }
            room.notifyChange();
        }
        else {
            var room = new WaitRoom(players);
            room.joinRoom(this.user);
            room.notifyChange();
        }
    };
    Connection.prototype.actionSetReadyWaitRoom = function (ready) {
        var room = WaitRoom.findByUser(this.user);
        if (room == undefined) {
            return;
        }
        room.setReady(this.user, ready);
        room.notifyChange();
    };
    Connection.prototype.actionMakeGuess = function (guess) {
        var room = GameRoom.findByUser(this.user);
        if (room == undefined) {
            return;
        }
        var t = {
            response: "MakeGuess",
            success: room.makeGuess(this.user, guess)
        };
        this.responseReporter(t);
        room.notifyChange();
    };
    return Connection;
}());
exports.Connection = Connection;
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User(name, listener) {
        var _this = _super.call(this) || this;
        _this.listener = [];
        _this.addListener = function (listener) { return _this.listener.push(listener); };
        _this.notifyChange = function () {
            _this.listener.forEach(function (e) { return e(); });
        };
        _this.getSessionId = function () { return _this.id; };
        _this.setName = function (name) {
            _this.name = name;
        };
        _this.getName = function () { return _this.name; };
        _this.listener.push(listener);
        User.indexer.add(_this);
        _this.name = name;
        _this.renderState = _this.renderState.bind(_this);
        return _this;
    }
    User.prototype.renderState = function () {
        return {
            sessionId: this.getSessionId(),
            userName: this.name
        };
    };
    User.indexer = new IndexerId();
    User.findById = function (id) { return User.indexer.get(id); };
    return User;
}(IdentifiedById));
var WaitRoom = /** @class */ (function (_super) {
    __extends(WaitRoom, _super);
    function WaitRoom(playerCount) {
        if (playerCount === void 0) { playerCount = 2; }
        var _this = _super.call(this) || this;
        _this.maxPlayer = 2;
        _this.users = new Set();
        _this.ready = new Map();
        _this.notifyChange = function () { return _this.users.forEach(function (e) { return e.notifyChange(); }); };
        _this.getId = function () { return _this.id; };
        if ([2, 3, 4, 5].find(function (e) { return e == playerCount; }) != undefined) {
            _this.maxPlayer = playerCount;
        }
        else {
            _this.maxPlayer = 2;
        }
        WaitRoom.indexer.add(_this);
        _this.joinRoom = _this.joinRoom.bind(_this);
        _this.leaveRoom = _this.leaveRoom.bind(_this);
        _this.setReady = _this.setReady.bind(_this);
        _this.renderState = _this.renderState.bind(_this);
        return _this;
    }
    WaitRoom.prototype.joinRoom = function (user) {
        if (this.users.has(user)) {
            return true;
        }
        if (this.users.size < this.maxPlayer) {
            this.users.add(user);
            WaitRoom.userIndex.set(user, this);
            return true;
        }
        return false;
    };
    WaitRoom.prototype.leaveRoom = function (user) {
        this.users.delete(user);
        this.ready.delete(user);
        WaitRoom.userIndex.delete(user);
        if (this.users.size == 0) {
            WaitRoom.indexer.del(this.id);
        }
    };
    WaitRoom.prototype.setReady = function (user, ready) {
        var _this = this;
        this.ready.set(user, ready);
        var allReady = this.users.size == this.maxPlayer;
        this.users.forEach(function (e) {
            if (!_this.ready.has(e) || _this.ready.get(e) == false) {
                allReady = false;
            }
        });
        if (allReady) {
            this.ready.clear();
            new GameRoom(Array.from(this.users));
        }
    };
    WaitRoom.findByUser = function (user) {
        return WaitRoom.userIndex.get(user);
    };
    WaitRoom.findById = function (id) {
        return WaitRoom.indexer.get(id);
    };
    WaitRoom.prototype.renderState = function (user) {
        var _this = this;
        var usersArray = Array.from(this.users);
        var usersSorted = usersArray.sort(function (a, b) {
            if (a == b)
                return 0;
            if (a == user)
                return 1;
            if (b == user)
                return -1;
            return a.id > b.id ? 1 : -1;
        });
        return {
            numPlayer: this.maxPlayer,
            roomId: this.getId(),
            users: usersSorted.map(function (e) {
                var ready = _this.ready.get(e);
                return ({
                    name: e.getName(),
                    ready: ready === undefined ? false : ready
                });
            })
        };
    };
    WaitRoom.indexer = new IndexerId();
    WaitRoom.userIndex = new Map();
    return WaitRoom;
}(IdentifiedById));
var GameRoom = /** @class */ (function () {
    function GameRoom(users) {
        var _this = this;
        this.notifyChange = function () { return _this.users.forEach(function (e) { return e.user.notifyChange(); }); };
        users.forEach(function (e) { return GameRoom.userIndex.set(e, _this); });
        var c = GameRoom.distributeCards(users.length);
        this.users = users.sort(function (a, b) {
            if (a == b)
                return 0;
            else if (a.id > b.id)
                return 1;
            else
                return -1;
        }).map(function (v, i) { return ({
            user: v,
            winner: 0,
            cards: c.players[i].map(function (e) { return ({ value: e, open: false }); })
        }); });
        this.openCards = c.open;
        this.turn = 0;
        this.makeGuess = this.makeGuess.bind(this);
        this.renderState = this.renderState.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
    }
    GameRoom.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
    GameRoom.distributeCards = function (players) {
        var _a;
        var cardCounts = {
            2: { players: 7, open: 7 },
            3: { players: 7, open: 0 },
            4: { players: 5, open: 4 },
            5: { players: 4, open: 4 },
        };
        var cards = [];
        for (var i = 1; i <= 7; i++) {
            for (var j = 1; j <= i; j++) {
                cards.push(i);
            }
        }
        for (var i = 0; i < cards.length; i++) {
            var j = GameRoom.randomInt(i, cards.length);
            _a = [cards[j], cards[i]], cards[i] = _a[0], cards[j] = _a[1];
        }
        var r = {
            players: [],
            open: []
        };
        for (var i = 0; i < players; i++) {
            r.players.push(cards.splice(0, cardCounts[players].players));
        }
        r.open = cards.splice(0, cardCounts[players].open);
        return r;
    };
    GameRoom.prototype.leaveRoom = function (user) {
        GameRoom.userIndex.delete(user);
    };
    GameRoom.prototype.makeGuess = function (user, card) {
        if (this.users[this.turn].user !== user) {
            return false;
        }
        var u = this.users[this.turn];
        var c = this.users[this.turn].cards;
        var nextUserOffset = 1;
        while (nextUserOffset < this.users.length &&
            this.users[(this.turn + nextUserOffset) % this.users.length].winner != 0) {
            nextUserOffset++;
        }
        this.turn = (this.turn + nextUserOffset) % this.users.length;
        var t = Array.from(c.entries()).filter(function (e) { return e[1].value == card && !e[1].open; }).map(function (e) { return e[0]; });
        if (t.length == 0) {
            return false;
        }
        c[t[GameRoom.randomInt(0, t.length)]].open = true;
        if (c.filter(function (e) { return !e.open; }).length == 0) {
            u.winner = this.users.filter(function (e) { return e.winner != 0; }).length + 1;
        }
        return true;
    };
    GameRoom.findByUser = function (user) {
        return GameRoom.userIndex.get(user);
    };
    GameRoom.prototype.renderState = function (user) {
        return {
            turn: this.turn,
            you: this.users.findIndex(function (e) { return e.user == user; }),
            users: this.users.map(function (e) { return ({
                name: e.user.getName(),
                winner: e.winner,
                cards: e.user != user ? e.cards :
                    e.cards.map(function (c) { return ({
                        value: c.open ? c.value : 0,
                        open: c.open
                    }); })
            }); }),
            openCards: this.openCards,
        };
    };
    GameRoom.userIndex = new Map();
    return GameRoom;
}());
//# sourceMappingURL=game.js.map