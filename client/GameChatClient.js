/**
 * Created by dnsullivan on 9/24/15.
 */

/* Access level constants */
USER_BANNED = 'USER_BANNED';
REGULAR = 'REGULAR';

/**
 * Global functions used by the client
 * @namespace GameChatClient
 */
GameChatClient = {

    /* General use chat room access control functions */
    // TODO Confirm this works
    /**
     * @function allowUserIntoChatRoom
     * @memberof GameChatClient
     * @desc Allows user into chat room
     * @param {String} userId - ID of user
     * @param {String} chatRoomId - ID of chat room
     */
    allowUserIntoChatRoom: function (userId, chatRoomId) {
        // First put the user into the REGULAR list
        console.log(
            "allowUserIntoChatRoom(): Calling setUserChatRoomAccessLevel "
            + "to grant access to userId "
            + userId
            + "for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, REGULAR, true);
        // Now revoke their BANNED membership if it exists
        console.log(
            "allowUserIntoChatRoom(): Calling setUserChatRoomAccessLevel "
            + "to revoke any existing ban for userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, USER_BANNED, false);
    },

    // TODO Confirm this works
    /**
     * @function banUserFromChatRoom
     * @memberof GameChatClient
     * @desc Bans user from chat room.
     * @param {String} userId - ID of user
     * @param {String} chatRoomId - ID of chat room
     */
    banUserFromChatRoom: function (userId, chatRoomId) {
        // First ban the user
        console.log(
            "banUserFromChatRoom(): Calling setUserChatRoomAccessLevel to ban userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, USER_BANNED, true);
        // Now revoke their REGULAR membership
        console.log(
            "banUserFromChatRoom(): Calling setUserChatRoomAccessLevel "
            + " to revoke REGULAR membership for userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, REGULAR, false);
    },

    // TODO Confirm this works
    /**
     * @function inviteUserToChatRoom
     * @memberof GameChatClient
     * @desc Invites user to existing chat room and grants them access.
     * @param {String} userId - ID of user
     * @param {String} chatRoomId - ID of chat room
     * @param {?String} inviteMessage - Message to display in invite
     * @returns {String} ID of new ChatRoomInvites doc
     */
    inviteUserToChatRoom: function (userId, chatRoomId, inviteMessage) {
        // First put the user into the REGULAR list
        console.log(
            "inviteUserToChatRoom(): Calling setUserChatRoomAccessLevel "
            + " to grant access to userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, REGULAR, true);
        // Now revoke their BANNED membership if it exists
        console.log(
            "inviteUserToChatRoom(): Calling setUserChatRoomAccessLevel "
            + "to revoke any existing ban for userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.setUserChatRoomAccessLevel(userId, chatRoomId, USER_BANNED, false);
        // Finally, send an invite to the user
        console.log(
            "inviteUserToChatRoom(): Calling createChatRoomInvite() to send invite to userId "
            + userId
            + " for chatRoomId "
            + chatRoomId
        );
        GameChatClient.createChatRoomInvite(userId, chatRoomId, inviteMessage);
    },

    /* Chatroom/invite creation functions */

    /**
     * @function createChatRoom
     * @memberof GameChatClient
     * @desc Creates a new chat room, sets all users in Map arg to their mapped access value
     * and sends a ChatRoomInvite to those users.
     * @param {String} roomname - Name of chat room
     * @param {Map} users - usersAccess Map of user ID keys/access values to allow into chat room
     * @param {Map} flags - Configuration options for chatroom (isPublic, etc.)
     * @param {?String} gameId - ID of game document (if one is set)
     * @param {?String} inviteMessage - Inviter message to invitees
     * @returns {String} ID of ChatRooms doc
     */
    createChatRoom: function (roomname, users, flags, gameId, inviteMessage) {

        var usersArray = [];

        function usersToArray(value, key, map) {
            usersArray.push([key, value])
        } // TODO Try putting a semicolon here at some point, looks cleaner

        users.forEach(usersToArray);

        var newChatRoomId;

        // TODO Remove (only used for debugging)
        console.log("createChatRoom(): calling Meteor.methods.insert()");

        newChatRoomId = ChatRooms.insert({
            adminId: Meteor.userId(),
            roomname: roomname,
            isPublic: flags.get('isPublic'),
            gameId: gameId,
            accessRegular: [],
            accessBanned: [],
            invited: [],
            messages: [],
            currentUsers: []
        });

        console.log("createChatRoom(): newChatRoomId=" + newChatRoomId);
        console.log("createChatRoom(): Name of new ChatRooms doc: "
            + ChatRooms.findOne(newChatRoomId).roomname);

        console.log("createChatRoom(): Creating access levels and invites");

        // TODO Change this to also use values in Map 'users' to set user permissions
        // Create chat room user access levels and invites
        for (var i = 0; i < usersArray.length; i++) {

             GameChatClient.setUserChatRoomAccessLevel(
                usersArray[i][0],
                newChatRoomId,
                REGULAR,
                true
            );
            var newInviteId
                = GameChatClient
                .createChatRoomInvite(
                usersArray[i][0],
                newChatRoomId,
                inviteMessage
            );
            console.log("Access level for userId "
                + usersArray[i][0]
                + " has been set to "
                + REGULAR
                + " and invite with id "
                + newInviteId
                + " has been created for them"
            );
        }

        return newChatRoomId;

    },

    // TODO Confirm this works
    /**
     * @function setUserChatRoomAccessLevel
     * @memberof GameChatClient
     * @desc Sets access level for user.
     * Note that REGULAR and USER_BANNED are two separate lists.
     * REGULAR is the access whitelist. If your room is private (isPublic: false),
     * users that are not members of the room's REGULAR group will not be able to see the room,
     * but they can be added later with a single call to this function.
     * USER_BANNED is the access blacklist. Users that are members of USER_BANNED
     * will not be able to see the room, even if it is public (isPublic: false).
     * Users must be removed from USER_BANNED with a call to this function
     * before they can see the room.
     * Generally speaking, you should use {@link GameChatClient#banUserFromChatRoom},
     * {@link GameChatClient#allowUserIntoChatRoom}
     * or {@link GameChatClient#inviteUserToChatRoom}
     * rather than call this function directly. Those functions will call this one
     * and add/remove the users from each list as appropriate.
     * @param {String} userId - ID of user
     * @param {String} chatRoomId - ID of chat room
     * @param {String} accessLevel - Access level of user (USE ESTABLISHED CONSTANTS)
     * @param {Boolean} add - True for adding user, false for removing user
     * @returns Updated ChatRoom document if set was successful, null otherwise
     */
    setUserChatRoomAccessLevel: function (userId, chatRoomId, accessLevel, add) {
        switch (accessLevel) {
            case REGULAR:
                var userRegularSet;
                if(add) {
                    console.log(
                        "setUserChatRoomAccessLevel(): "
                        + "Adding REGULAR membership for userId "
                        + userId
                    );
                    userRegularSet = ChatRooms.update(chatRoomId, {$push:{accessRegular: userId}});
                } else {
                    console.log(
                        "setUserChatRoomAccessLevel(): "
                        + "Removing REGULAR membership for userId "
                        + userId
                    );
                    userRegularSet = ChatRooms.update(
                        chatRoomId,
                        {$pull:{accessRegular:userId,currentUsers:userId}
                    });
                }
                return userRegularSet;
            case USER_BANNED:
                var userBanSet;
                if(add) {
                    console.log(
                        "setUserChatRoomAccessLevel(): "
                        + "Adding USER_BANNED membership for userId "
                        + userId
                    );
                    userBanSet = ChatRooms.update(
                        chatRoomId,
                        {$push:{accessBanned:userId},$pull:{currentUsers:userId}
                    });
                } else {
                    console.log(
                        "setUserChatRoomAccessLevel(): "
                        + "Removing USER_BANNED membership for userId "
                        + userId
                    );
                    userBanSet = ChatRooms.update(chatRoomId, {$pull:{accessBanned: userId}});
                }
                return userBanSet;
            default:
                return null;
        }
    },

    /**
     * @function createChatRoomInvite
     * @memberof GameChatClient
     * @desc Create chat room invite for user
     * @param {String} userId - ID of user
     * @param {String} chatRoomId - ID of chat room
     * @param {?String} inviteMessage - Inviter message for invitee
     * @returns {String} ID of new ChatRoomInvites doc
     */
    createChatRoomInvite: function (userId, chatRoomId, inviteMessage) {
        var inviterName = Meteor.user().username;
        var inviteGameId = ChatRooms.findOne(chatRoomId).gameId;
        var newInviteMessage;

        // Create invite message if it hasn't already been created
        if (inviteMessage == null) {
            if (inviteGameId != null && Games.findOne(inviteGameId).count() === 1) {
                newInviteMessage
                    = Meteor.user().username
                    + " invites you to play "
                    + Games.findOne(inviteGameId).gameName;
            } else {
                newInviteMessage
                    = Meteor.user().username
                    + " has invited you to chat room "
                    + ChatRooms.findOne(chatRoomId).roomname;
            }
        } else {
            newInviteMessage = ": " + inviteMessage;
        }

        // Make sure user is in list of invited users
        if (ChatRooms.findOne(chatRoomId).invited.indexOf(userId) === -1) {
            ChatRooms.update(chatRoomId, {$push:{invited:userId}});
        }

        return ChatRoomsInvites
            .insert({
                userId: userId,
                chatRoomId: chatRoomId,
                inviterName: inviterName,
                inviteMessage: newInviteMessage
            }
        );
    },

    // TODO Hide chat rooms that the user does not have access to (not invited, banned, etc.)
    /**
     * @function getChatRooms
     * @memberof GameChatClient
     * @desc Returns a list of all chat rooms that the user can join.
     * @returns {Mongo.Cursor} List of all chat rooms that the user can join
     */
    getChatRooms: function () {
        return ChatRooms.find({});
    },

    // TODO Clean this up
    /**
     * @function getChatRoomsInvites
     * @memberof GameChatClient
     * @desc Returns a list of all of the user's chat room invites.
     * @returns {Mongo.Cursor} List of all chat room invites
     */
    getChatRoomsInvites: function () {
        return ChatRoomsInvites.find({});
    },

    /**
     * @function getChatRoomsInvitesCount
     * @memberof GameChatClient
     * @desc Returns count of all of the user's unaccepted/undeclined invites
     * @returns {Number} Number of unaccepted/undeclined invites
     */
    getChatRoomsInvitesCount: function () {
        return ChatRoomsInvites.find({userId: Meteor.userId()}).count();
    },

    /**
     * @function acceptInvite
     * @memberof GameChatClient
     * @desc Accepts an invitation and switches to attached room
     * @param inviteId - ID of chat room invite
     */
    acceptInvite: function(inviteId) {
        GameChatClient
            .setCurrentRoomId(ChatRoomsInvites.findOne({_id: inviteId}).chatRoomId);
        ChatRoomsInvites.remove(inviteId);
    },

    /**
     * @function declineInvite
     * @memberof GameChatClient
     * @desc Declines an invitation
     * @param inviteId - ID of chat room invite
     */
    declineInvite: function(inviteId) {
        ChatRoomsInvites.remove(inviteId);
    },

    /**
     * @function getCurrentRoomId
     * @memberof GameChatClient
     * @desc Returns the ID of the client's currently active chat room
     * @returns {String} ID of client's currently active chat room
     */
    getCurrentRoomId: function () {
        return Session.get("currentRoomId")
    },

    /**
     * @function getOnlineUsers
     * @memberof GameChatClient
     * @desc Returns a list of all users (other than the calling one)
     * that are currently online.
     * @returns {Mongo.Cursor} List of all users that are currently online
     */
    getOnlineUsers: function () {
        return Meteor.users.find({ "status.online": true , _id: {$ne: Meteor.userId()} });
    },

    /**
     * @function sendChatMessage
     * @memberof GameChatClient
     * @desc Sends a message from the user to a chat room.
     * @param {String} roomId - Id of chat room to update with message
     * @param {String} message - Contents of user's message
     * @returns {Number} 1 if successful, 0 otherwise
     */
    sendChatMessage: function (roomId, message) {
        Meteor.call('sendNewChatMessage', roomId, message);
    },

    /**
     * @function setCurrentRoomId
     * @memberof GameChatClient
     * @desc Sets the ID of the client's currently active room
     * @param {String} newCurrentRoomId - ID of the client's new currently active room
     */
    setCurrentRoomId: function (newCurrentRoomId) {
        var oldRoomId = GameChatClient.getCurrentRoomId();
        Session.set("currentRoomId", newCurrentRoomId);
        Meteor.call('leaveChatRoom', oldRoomId);
        Meteor.call('joinChatRoom', newCurrentRoomId);
    },

    /* Game Functions */
    // TODO Make these functions available to site admin only

    // TODO Add game images
    /**
     * @function addGame
     * @memberof GameChatClient
     * @desc Adds game to GameChat DB
     * @param {String} gameName - Name of game
     * @param {String} gameDescription - Description of game
     * @param {String} gameUrl - URL of game
     * @returns Unique _id of document if successful
     */
    addGame: function (gameName, gameDescription, gameUrl) {
        return Games.insert(
            {
                gameName: gameName,
                gameDescription: gameDescription,
                gameUrl: gameUrl
            }
        );
    },

    // TODO Remove game images
    /**
     * @function removeGame
     * @memberof GameChatClient
     * @desc Removes game from GameChat DB
     * @param {String} gameId - ID of game document
     */
    removeGame: function (gameId) {
        Games.remove(gameId);
    },

    // TODO Update game images
    /**
     * @function updateGame
     * @memberof GameChatClient
     * @desc Updates game document in GameChat DB
     * @param {String} gameId - ID of game document
     * @param {?String} gameName - Name of game
     * @param {?String} gameDescription - Description of game
     * @param {?String} gameUrl - URL of game
     * @returns {Number} Number of affected documents
     */
    updateGame: function (gameId, gameName, gameDescription, gameUrl) {
        if (gameName != null) {
            Games.update(gameId, {gameName: gameName});
        }

        if (gameDescription != null) {
            Games.update(gameId, {gameDescription: gameDescription});
        }

        if (gameUrl != null) {
            Games.update(gameId, {gameUrl : gameUrl});
        }
    },

    /**
     * @function getGames
     * @memberof GameChatClient
     * @desc Returns a list of all games for which a chat room can be started.
     * @returns {Mongo.Cursor} List of all games that can be assigned to a chat room
     */
    getGames: function () {
        return Games.find({});
    },

    // TODO THIS IS HORRIBLE FIX IT
    /**
     * @function userIsAdmin
     * @memberof GameChatClient
     * @desc Returns true/false if the user is/is not an admin.
     * @returns {Boolean} True if user is admin, false otherwise
     */
    userIsAdmin:function () {
        var gameChatClientSiteAdminIds = [];
        if (Meteor.users.find({username:"dnsulliv"}).count() === 1) {
            gameChatClientSiteAdminIds.push(Meteor.users.findOne({username:"dnsulliv"})._id);
        }

        if (Meteor.users.find({username:"aaron"}).count() === 1) {
            gameChatClientSiteAdminIds.push(Meteor.users.findOne({username:"aaron"})._id);
        }
		
		if (Meteor.users.find({username:"admin"}).count() === 1) {
            gameChatClientSiteAdminIds.push(Meteor.users.findOne({username:"admin"})._id);
        }

        if (gameChatClientSiteAdminIds.indexOf(Meteor.userId()) !== -1) {
            return true;
        } else {
            return false;
        }
    }
};
