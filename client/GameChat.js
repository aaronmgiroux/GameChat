/** * Global functions used by the client * @namespace */GameChatClient = {    // TODO    /**     * Ban user currently in chat room     * @param {Number} userId ID of user     * @param {Number} chatRoomId ID of chat room     * @returns {Boolean} True if successful     */    banUserFromChatRoom: function (userId, chatRoomId) {        return null;    },    /**     * Creates a new chat room.     * @param {String} name Name of chat room     * @param {String} inviteMessage Name of chat room     * @param {Map} usersAccess Map of user ID keys/permission values to allow into chat room     * @returns {Number} ID of ChatRooms doc     */    createChatRoom: function (roomname, users, inviteMessage) {        var usersArray = [];        function usersToArray(value, key, map) {            usersArray.push([key, value])        }        users.forEach(usersToArray);        var newChatRoomId;        // TODO Remove (only used for debugging)        console.log("createChatRoom(): calling ChatRooms.insert()");        // TODO Remove default public setting        // Create chat room        newChatRoomId = ChatRooms.insert({roomname:roomname,isPublic:0});        console.log("createChatRoom(): newChatRoomId=" + newChatRoomId);        console.log("createChatRoom(): Name of new ChatRooms doc: "                    + ChatRooms.findOne(newChatRoomId).roomname);        console.log("createChatRoom(): Creating access levels and invites");        // TODO Change this to also use values in Map 'users' to set user permissions        // TODO Add inviter message functionality        // Create chat room user access levels and invites        for (var i = 0; i < usersArray.length; i++) {            var newAccessLevelId = GameChatClient.createChatRoomAccessLevel(usersArray[0][0], newChatRoomId);            var newInviteId                = GameChatClient                .createChatRoomInvite(                usersArray[0][0],                newChatRoomId,                Meteor.user().username,                inviteMessage            );            console.log("Access level for userId "                + usersArray[0][0]                + " has id "                + newAccessLevelId            );            console.log("Invite for userId "                + usersArray[0][0]                + " has id "                + newInviteId            );        }        return newChatRoomId;    },    // TODO Make this do something other than just let the user enter the chat room    /**     * Create access level for user     * @param {Number} ID of user     * @param {Number} ID of chat room     * @returns {Number} ID of new ChatRoomAccessLevels doc     */    createChatRoomAccessLevel: function (userId, chatRoomId) {        return ChatRoomsAccessLevels.insert({userId: userId, chatRoomId: chatRoomId});    },    /**     * Create chat room invite for user     * @param {Number} ID of user     * @param {Number} ID of chat room     * @returns {Number} ID of new ChatRoomInvites doc     */    createChatRoomInvite: function (userId, chatRoomId, inviterName, inviteMessage) {        return ChatRoomsInvites            .insert({                userId: userId,                chatRoomId: chatRoomId,                inviterName: inviterName,                inviteMessage: inviteMessage            }        );    },    // TODO Hide chat rooms that the user does not have access to (not invited, banned, etc.)    /**     * Returns a list of all chat rooms.     * @returns {Mongo.Cursor} List of all chat rooms     */    getChatRooms: function () {        return ChatRooms.find({});    },    // TODO    /**     * Returns a list of all chat room invites.     * @returns {Mongo.Cursor} List of all chat room invites     */    getChatRoomsInvites: function () {        return ChatRoomsInvites.find({userId: Meteor.userId()});    },    /**     * Returns count of all of the user's unaccepted/undeclined invites     * @returns {Number} Number of unaccepted/undeclined invites     */    getChatRoomsInvitesCount: function () {        return ChatRoomsInvites.find({userId: Meteor.userId()}).count();    },    /**     * Accepts an invitation and switches to attached room     * @param inviteId     */    acceptInvite: function(inviteId) {        GameChatClient            .setCurrentRoomId(ChatRoomsInvites.findOne({_id: inviteId}).chatRoomId);        ChatRoomsInvites.remove(inviteId);    },    /**     * Declines an invitation     * @param inviteId     */    declineInvite: function(inviteId) {        ChatRoomsInvites.remove(inviteId);    },    /**     * Returns the ID of the client's currently active chat room     * @returns {Number} ID of client's currently active chat room     */    getCurrentRoomId: function () {        return Session.get("currentRoomId")    },    /**     * Returns a list of all users that are currently online.     * @returns {Mongo.Cursor} List of all users that are currently online     */    getOnlineUsers: function () {        return Meteor.users.find({ "status.online": true , _id: {$ne: Meteor.userId()} });    },    /**     * Sends a message from the user to a chat room.     * @param roomId {Number} Id of chat room to update with message     * @param message {String} Contents of user's message     * @returns True if successful     */    sendChatMessage: function (roomId, message) {        // Grab user info        var messageUserId = Meteor.userId();        var messageUserName = Meteor.user().username;        var messageDate = Date.now();        return ChatRooms            .update(/* messageUserId,*/ roomId, /*['messages'],*/ {$push:{messages: {                name: messageUserName,                text: message,                createdAt: messageDate            }        }        });    },    /**     * Sets the ID of the client's currently active room     * @param {Number} ID od the client's new currently active room     */    setCurrentRoomId: function (newCurrentRoomId) {        Session.set("currentRoomId", newCurrentRoomId);    },    // TODO    /**     * Unban user from chat room     * @param {Number} ID of user     * @param {Number} ID of chat room     * @returns {Boolean} True if successful     */    unbanUserFromChatRoom: function (userId, chatRoomId) {        return null;    }};// Holds list of users to invite to roomGameChatClientLists = {};Accounts.ui.config({   passwordSignupFields: 'USERNAME_AND_EMAIL'});Tracker.autorun(function () {    Meteor.subscribe("chatrooms");    Meteor.subscribe("onlusers");    Meteor.subscribe("chatroomsinvites");});Template.mainNav.helpers({    'invitecount': function () {        var currentInvitesCount = GameChatClient.getChatRoomsInvitesCount();        if (currentInvitesCount > 0) {            return '(' + currentInvitesCount + ')';        } else {            return '';        }    }});Template.roompage.helpers({    'chatrooms':function () {        return GameChatClient.getChatRooms();    }});Template.roompage.events({    'click .room': function () {        GameChatClient.setCurrentRoomId(this._id);        console.log("Current room is now " + GameChatClient.getCurrentRoomId());    }});Template.roomcreatepage.helpers({    'onlusr':function () {        return GameChatClient.getOnlineUsers();    }});Template.roomcreatepage.events({    'click .toggle-checked': function () {        if (GameChatClientLists.inviteList === undefined) {            console.log(".toggle-checked: inviteList is undefined, creating new list");            GameChatClientLists.inviteList = new Map();        }        // TODO Add different permission values (moderator, etc.)        // Add/remove user from invite list        if(!this.checked) {            console.log(".toggle-checked: Setting userId " + this._id);            GameChatClientLists.inviteList.set(this._id, "user");            console.log(".toggle-checked: userId "                + this._id                + " now has value "                + GameChatClientLists.inviteList.get(this._id)            );            this.checked = (!this.checked);        } else {            console.log(".toggle-checked: Deleting userId " + this._id);            GameChatClientLists.inviteList.delete(this._id);            this.checked = (!this.checked);        }    },    'click .createroom': function () {        // TODO get rid of this thing        if (GameChatClientLists.inviteList !== undefined) {            console.log(".createroom: GameChatClientLists.inviteList is defined and has size "                        + GameChatClientLists.inviteList.size);        }        function printInvites(value, key, map) {            console.log("userId " + key + " has access level " + value);        }        GameChatClientLists.inviteList.forEach(printInvites);        // Grab desired name for new room        var newRoomName = document.getElementById('newroomname');        // Grab invite message for new room        var newRoomMessage = document.getElementById('newroommessage')        // Create the chat room        console.log(".createroom: calling createChatRoom(), newRoomName=" + newRoomName.value);        GameChatClient.createChatRoom(            newRoomName.value,            GameChatClientLists.inviteList,            newRoomMessage.value        );        // Destroy inviteList (no longer needed)        GameChatClientLists.inviteList.clear();    }});/*Template.roomcreatepage.onRendered(function () {    // Create blank user invite list    inviteList = new Map();});*/Template.invitespage.helpers({    'chatroomsinvite': function () {        return GameChatClient.getChatRoomsInvites();    },});Template.invitespage.events({    'click .acceptinvite': function () {        GameChatClient.acceptInvite(this._id);    },    'click .declineinvite': function () {        GameChatClient.declineInvite(this._id);    },});Template.sidebar.helpers({    'onlusr':function () {        return GameChatClient.getOnlineUsers();    }});Template.sidebar.events({    'click .user':function(){        // TODO Remove (only used for debugging)        console.log('this._id before room existence check: ' + this._id);        console.log('userId: ' + Meteor.userId());        var res=ChatRooms.findOne({chatIds:{$all:[this._id,Meteor.userId()]}});        if(res) {            //already room exists            GameChatClient.setCurrentRoomId(res._id);        }        else {            //no room exists            var newRoom = ChatRooms.insert({chatIds:[this._id , Meteor.userId()],messages:[]});            // TODO Remove (only used for debugging)            console.log('this._id after room existence check (did not exist): ' + this._id);            GameChatClient.setCurrentRoomId(newRoom);        }    }});Template.messages.helpers({    'msgs':function() {        var result = ChatRooms.findOne({_id:GameChatClient.getCurrentRoomId()});        return result.messages;    }});Template.input.events = {    'keydown input#message' : function (event) {    if (event.which == 13) {        if (Meteor.user()) {            var message = document.getElementById('message');            if (message.value !== '') {                // Send the message                GameChatClient.sendChatMessage(GameChatClient.getCurrentRoomId(), message.value);                // Clear the contents of the message field                document.getElementById('message').value = '';                message.value = '';            }        }        else        {           alert("login to chat");        }    }  }}