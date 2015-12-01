// Holds list of users to invite to roomGameChatClientLists = {};Accounts.ui.config({   passwordSignupFields: 'USERNAME_AND_EMAIL'});// Cleanup, initial values, etc. upon client startMeteor.startup(function() {    if (Meteor.isClient) {        Session.set('newChatRoomGameId', null);    }});Tracker.autorun(function () {    Meteor.subscribe("chatrooms");    Meteor.subscribe("onlusers");    Meteor.subscribe("chatroomsinvites");		Meteor.subscribe("allusers");    Meteor.subscribe("games");    Meteor.subscribe("friends");});Template.homepage.helpers({    'chatroomName': function () {        var currentRoomId = GameChatClient.getCurrentRoomId();        // TODO This probably isn't the best way to do this; refactor later        // Set default chat room to Public Chat        if (currentRoomId == null) {            GameChatClient                .setCurrentRoomId(ChatRooms.findOne({roomname:'Public Chat'})._id);            return "Public Chat";        }        return ChatRooms.findOne(GameChatClient.getCurrentRoomId()).roomname;    },    'chatroomGameName': function () {        var currentGameId = ChatRooms.findOne(GameChatClient.getCurrentRoomId()).gameId;        if (currentGameId != null) {            return Games.findOne(currentGameId).gameName;        }    },    'chatroomGameUrl': function () {        var currentGameId = ChatRooms.findOne(GameChatClient.getCurrentRoomId()).gameId;        if (currentGameId != null) {            return Games.findOne(currentGameId).gameUrl;        }    },    'hasGame': function() {        return ChatRooms.findOne(GameChatClient.getCurrentRoomId()).gameId != null;    }});Template.mainNav.helpers({    'invitecount': function () {        var currentInvitesCount = GameChatClient.getChatRoomsInvitesCount();        if (currentInvitesCount > 0) {            return '(' + currentInvitesCount + ')';        } else {            return '';        }    },    'chatroomName': function () {        return ChatRooms.findOne(GameChatClient.getCurrentRoomId).name;    },		'userisadmin': function () {        return GameChatClient.userIsAdmin(Meteor.userId());    }});Template.gamescreatepage.helpers({    'userisadmin': function () {        return GameChatClient.userIsAdmin(Meteor.userId());    }});Template.dashboardpage.helpers({	'user': function(){		return Meteor.users.find();	 },	'game': function(){		return GameChatClient.getGames();	},    'userisadmin': function () {        return GameChatClient.userIsAdmin(Meteor.userId());	},	'usercount': function(){		return Meteor.users.find().count();	},	'gamecount': function(){		return GameChatClient.getGames().count();	}});Template.game_item.events({	'click .deletegame': function () {        GameChatClient.removeGame(this._id);    }});/*Template.user_item.onCreated(function () {    this.adminCheck = function () {        return GameChatClient.userIsAdmin(this._id);    }});*/Template.user_item.helpers({    'useradmincheck': function () {        console.log("userAdminCheck: now running")        if (GameChatClient.userIsAdmin(Template.currentData()._id)) {            console.log("userAdminCheck: user IS currently an admin")            return "checked";        } else {            console.log("userAdminCheck: user IS NOT currently an admin")            return null;        }    }});Template.user_item.events({	'click .deleteuser': function () {        GameChatClient.deleteAccount(this._id);    },    'click .toggle-user-isadmin': function () {        GameChatClient.toggleUserAdmin(this._id);    }});Template.gamespage.events({    'click .gameinvite': function () {        // Save gameId for chat room creation        Session.set('newChatRoomGameId', this._id);    }});Template.gamespage.helpers({	'game': function(){		return GameChatClient.getGames();	},	'gamecount': function(){		return GameChatClient.getGames().count();	}});Template.gamescreatepage.events({    'click .creategame': function () {                // Grab desired name, description, and url for new game        var newGameName = document.getElementById('newgamename');		var newGameDescription = document.getElementById('newgamedescription');		var newGameUrl = document.getElementById('newgameurl');        // Create the game        console.log(".creategame: calling addGame(), newGameName=" + newGameName.value + ", newGameDescription=" + newGameDescription.value + ", newGameUrl=" + newGameUrl.value);        GameChatClient.addGame(            newGameName.value,            newGameDescription.value,            newGameUrl.value        );    }});Template.roompage.helpers({    'chatrooms':function () {        return GameChatClient.getChatRooms();    }});Template.roompage.events({    'click .room': function () {        GameChatClient.setCurrentRoomId(this._id);        console.log("Current room is now " + GameChatClient.getCurrentRoomId());    },    'click .newroom': function () {        // Clear newRoomGameId session value since we're creating a room without a game        Session.set('newChatRoomGameId', null);    }});Template.roomcreatepage.helpers({    'onlusr':function () {        return GameChatClient.getOnlineUsers(false, false);    },    'hasgame':function () {        return !Session.equals('newChatRoomGameId', null);    },    'newchatroomgamename':function () {        if (!Session.equals('newChatRoomGameId', null)) {            return Games.findOne(Session.get('newChatRoomGameId')).gameName;        } else {            return '';        }    }});Template.roomcreatepage.events({    'click .toggle-user-checked': function () {        if (GameChatClientLists.newRoomInviteList === undefined) {            console.log(".toggle-user-checked: newRoomInviteList is undefined, creating new list");            GameChatClientLists.newRoomInviteList = new Map();        }        // TODO Add different permission values (moderator, etc.)        // Add/remove user from invite list        if(!this.userchecked) {            console.log(".toggle-user-checked: Setting userId " + this._id);            GameChatClientLists.newRoomInviteList.set(this._id, "user");            console.log(".toggle-user-checked: userId "                + this._id                + " now has value "                + GameChatClientLists.newRoomInviteList.get(this._id)            );            this.userchecked = (!this.userchecked);        } else {            console.log(".toggle-user-checked: Deleting userId " + this._id);            GameChatClientLists.newRoomInviteList.delete(this._id);            this.userchecked = (!this.userchecked);        }    },    'click .toggle-public-checked': function () {        if (GameChatClientLists.newRoomFlags === undefined) {            console.log(".toggle-checked: newRoomInviteList is undefined, creating new list");            GameChatClientLists.newRoomFlags = new Map();        }        // TODO Add different permission values (moderator, etc.)        // Add/remove user from invite list        if(!this.publicchecked) {            console.log(".toggle-checked: Setting room to public");            GameChatClientLists.newRoomFlags.set('isPublic', true);            this.publicchecked = (!this.publicchecked);        } else {            console.log(".toggle-checked: Setting room to private");            GameChatClientLists.newRoomFlags.set('isPublic', false);            this.publicchecked = (!this.publicchecked);        }    },    'click .createroom': function () {        console.log(".createroom: Now running");        // TODO get rid of this thing        if (GameChatClientLists.newRoomInviteList !== undefined) {            console.log(".createroom: GameChatClientLists.newRoomInviteList is defined and has size "                        + GameChatClientLists.newRoomInviteList.size);        } else {            GameChatClientLists.newRoomInviteList = new Map();            console.log(".createroom: GameChatClientLists.newRoomInviteList was NOT defined, created empty map");        }        function printInvites(value, key, map) {            console.log("userId " + key + " has access level " + value);        }        GameChatClientLists.newRoomInviteList.forEach(printInvites);        // Grab desired name for new room        var newRoomName = document.getElementById('newroomname');        // Grab gameId for new room's game        var newRoomGameId;        if (!Session.equals('newChatRoomGameId', null)) {            newRoomGameId = Session.get('newChatRoomGameId');        } else {            newRoomGameId = null;        }        // Create empty invite list f user didn't invite anyone        if (GameChatClientLists.newRoomInviteList === undefined) {           GameChatClientLists.newRoomInviteList = new Map();        }        // Set room to private if user didn't set it explicitly        if (GameChatClientLists.newRoomFlags === undefined        ) {            GameChatClientLists.newRoomFlags = new Map();            GameChatClientLists.newRoomFlags.set('isPublic', false);        }        if (GameChatClientLists.newRoomFlags.get('isPublic') === undefined) {            GameChatClientLists.newRoomFlags.set('isPublic', false);        }        // TODO: Consider putting the custom message back        // Create the chat room        console.log(".createroom: calling createChatRoom(), newRoomName=" + newRoomName.value);        GameChatClient.createChatRoom(            newRoomName.value,            GameChatClientLists.newRoomInviteList,            GameChatClientLists.newRoomFlags,            newRoomGameId,            null        );        // Clear newRoomInviteList and newRoomFlags (values no longer needed)        GameChatClientLists.newRoomInviteList.clear();        GameChatClientLists.newRoomFlags.clear();        // Clear newRoomGameId (no longer needed)        Session.set('newChatRoomGameId', null);    }});Template.roomadminpage.helpers({    'allowedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var bannedCurrentUsers = currentChatRoom.accessBanned;        var allowedCurrentUsers = currentChatRoom.accessRegular        if (currentChatRoom.isPublic) {            return Meteor.users.find({"status.online": true, _id: {$nin: bannedCurrentUsers}});        } else {            return Meteor.users.find({"status.online": true, _id: {$in: allowedCurrentUsers}});        }    },    'uninvitedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var invitedCurrentUsers = currentChatRoom.invited;        return Meteor.users.find({            "status.online": true,            $and: [{_id:{$nin: invitedCurrentUsers}}, {_id: {$ne: Meteor.userId()}} ]        });    },    'bannedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var bannedCurrentUsers = currentChatRoom.accessBanned;        return Meteor.users.find({ "status.online": true , _id: {$in: bannedCurrentUsers} });    },});Template.roomadminpage.events({    'click .banuser': function () {        console.log("roomadminpage.events.banuser: Banning userId " + this._id);        GameChatClient.banUserFromChatRoom(            this._id,            GameChatClient.getCurrentRoomId()        );    },    'click .inviteuser': function () {        console.log("roomadminpage.events.inviteuser: Inviting userId " + this._id);        GameChatClient.inviteUserToChatRoom(            this._id,            GameChatClient.getCurrentRoomId(),            null        );    },    'click .unbanuser': function () {        console.log("roomadminpage.events.unbanuser: Unbanning userId " + this._id);        GameChatClient.allowUserIntoChatRoom(            this._id,            GameChatClient.getCurrentRoomId()        );    }});Template.invitespage.helpers({    'chatroomsinvite': function () {        return GameChatClient.getChatRoomsInvites();    },});Template.invitespage.events({    'click .acceptinvite': function () {        if (ChatRoomsInvites.findOne(this._id).chatRoomId != null) {            GameChatClient.acceptInvite(this._id);        } else {            GameChatClient.acceptFriendRequest(this._id);        }    },    'click .declineinvite': function () {        if (ChatRoomsInvites.findOne(this._id).chatRoomId != null) {            GameChatClient.declineInvite(this._id);        } else {            GameChatClient.denyFriendRequest(this._id);        }    },});Template.sidebar.helpers({    'onlusr':function () {        // If user has no friends, return all Online Users        if (Friends.find({userId:Meteor.userId()}).count() === 0            || Friends.findOne({userId:Meteor.userId()}).friends.length === 0) {            return GameChatClient.getOnlineUsers(false, false);        } else {            return GameChatClient.getOnlineUsers(true, false);        }    },    'onlfriend':function () {        return GameChatClient.getOnlineUsers(false, true);    }});Template.sidebar.events({    'click .user':function() {        var privateChatName =            "Private Chat - "            + Meteor.users.findOne(Meteor.userId()).username.toString()            + " & "            + Meteor.users.findOne(this.userId).username.toString();        if (ChatRooms.find({roomname:privateChatName}).count() === 0) {            var newPrivateChatUsers = new Map;            var newPrivateChatFlags = new Map;            newPrivateChatUsers.set(Meteor.userId(), "user");            newPrivateChatUsers.set(this._id, "user");            newPrivateChatFlags.set("isPublic", false);            GameChatClient.setCurrentRoomId(                GameChatClient.createChatRoom(                    privateChatName,                    newPrivateChatUsers,                    newPrivateChatFlags,                    null,                    "has invited you to private chat"                )            );        } else {            GameChatClient                .setCurrentRoomId(ChatRooms.findOne({roomname:privateChatName})._id);        }    }});Template.messages.helpers({    'msgs':function() {        var result = ChatRooms.findOne({_id:GameChatClient.getCurrentRoomId()});        return result.messages;    }});Template.currentusers.helpers({    'currentusr':function() {        var currentUsers = ChatRooms            .findOne(GameChatClient.getCurrentRoomId()).currentUsers;        var result = {currentusr:[]};        for (var i = 0; i < currentUsers.length; i++) {            if (Meteor.users.find({"status.online": true, _id:currentUsers[i]}).count() === 1)            console.log('currentusers: Getting name for userId ' + currentUsers[i]);            result.currentusr.push({name:Meteor.users.findOne(currentUsers[i]).username});        }        return result.currentusr;    }});Template.input.helpers({    'isChatAdmin': function () {        return GameChatClient.userIsAdmin(Meteor.userId())            || (ChatRooms.findOne(GameChatClient.getCurrentRoomId()).adminId === Meteor.userId());    }});Template.input.events = {    'keydown input#message' : function (event) {    if (event.which == 13) {        if (Meteor.user()) {            var message = document.getElementById('message');            if (message.value !== '') {                // Send the message                GameChatClient.sendChatMessage(GameChatClient.getCurrentRoomId(), message.value);                // Clear the contents of the message field                document.getElementById('message').value = '';                message.value = '';            }        }        else        {           alert("login to chat");        }    }  }}/* ===== Friends Page =====*/Template.friendspage.helpers({    'frienduser': function () {        return Meteor            .users            .find({_id:{$in:Friends.findOne({userId:Meteor.userId()}).friends}});    },    'friendusercount': function () {        if (Friends.find({userId:Meteor.userId()}).count() === 0) {            return 0;        }        return Meteor            .users            .find({_id:{$in:Friends.findOne({userId:Meteor.userId()}).friends}})            .count();    },    'otheruser': function () {        if (Friends.find({userId:Meteor.userId()}).count() === 0) {            return Meteor.users.find({_id:{$ne:Meteor.userId()}});        }        return Meteor            .users            .find(                {$and:                    [                        {_id:{$nin:Friends.findOne({userId:Meteor.userId()}).friends}},                        {_id:{$ne:Meteor.userId()}}                    ]                });    },    'otherusercount': function () {        if (Friends.find({userId:Meteor.userId()}).count() === 0) {            return Meteor.users.find({_id:{$ne:Meteor.userId()}}).count();        }        return Meteor            .users            .find({$and:[{_id:{$nin:Friends.findOne({userId:Meteor.userId()}).friends}},{_id:{$ne:Meteor.userId()}}]})            .count();    }});Template.otheruser_item.helpers({    'hasrequest': function () {        console.log("otheruser_item hasrequest helper: now running");        if (Friends.find({userId:Meteor.userId()}).count() === 0) {            console.log("otheruser_item hasrequest helper: returning false");            return false;        }        console.log("otheruser_item hasrequest helper: returning value");        return ((Friends.findOne({userId:Meteor.userId()}).requestsOpen.indexOf(this._id) !== -1)                ||                (Friends.findOne({userId:Meteor.userId()}).requestsDenied.indexOf(this._id) !== -1));    },    'requestpending': function () {        if (Friends.findOne({userId:Meteor.userId()}).requestsOpen.indexOf(this._id) !== -1            &&            Friends.findOne({userId:Meteor.userId()}).requestsDenied.indexOf(this._id) === -1) {            return true;        } else if (Friends.findOne({userId:Meteor.userId()}).requestsDenied.indexOf(this._id) !== -1) {            return false;        }        return false;    }});Template.otheruser_item.events({    'click .sendfriendrequest': function () {        GameChatClient.sendFriendRequest(this._id);    }});