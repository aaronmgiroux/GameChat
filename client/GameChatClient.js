/**
 * Created by dnsullivan on 9/24/15.
 */

/**
 * Global functions used by the client
 * @namespace GameChatClient
 */
GameChatClient = {

    // TODO
    /**
     * Ban user currently in chat room
     * @param {Number} userId - ID of user
     * @param {Number} chatRoomId - ID of chat room
     * @returns {Boolean} True if successful
     */
    banUserFromChatRoom: function (userId, chatRoomId) {
        return null;
    },

    /**
     * Creates a new chat room.
     * @param {String} roomname - Name of chat room
     * @param {Map} users - usersAccess Map of user ID keys/permission values to allow into chat room
     * @param {String} inviteMessage - Message to display in chat room invite
     * @returns {Number} ID of ChatRooms doc
     */
    createChatRoom: function (roomname, users, inviteMessage) {

        var usersArray = [];

        function usersToArray(value, key, map) {
            usersArray.push([key, value])
        }

        users.forEach(usersToArray);

        var newChatRoomId;

        // TODO Remove (only used for debugging)
        console.log("createChatRoom(): calling ChatRooms.insert()");

        // TODO Remove default public setting
        // Create chat room
        newChatRoomId = ChatRooms.insert({
            adminId: Meteor.userId(),
            roomname:roomname,
            isPublic:0
        });

        console.log("createChatRoom(): newChatRoomId=" + newChatRoomId);
        console.log("createChatRoom(): Name of new ChatRooms doc: "
            + ChatRooms.findOne(newChatRoomId).roomname);

        console.log("createChatRoom(): Creating access levels and invites");

        // TODO Change this to also use values in Map 'users' to set user permissions
        // TODO Add inviter message functionality
        // Create chat room user access levels and invites
        for (var i = 0; i < usersArray.length; i++) {
            var newAccessLevelId = GameChatClient.createChatRoomAccessLevel(usersArray[0][0], newChatRoomId);
            var newInviteId
                = GameChatClient
                .createChatRoomInvite(
                usersArray[0][0],
                newChatRoomId,
                Meteor.user().username,
                inviteMessage
            );
            console.log("Access level for userId "
                + usersArray[0][0]
                + " has id "
                + newAccessLevelId
            );
            console.log("Invite for userId "
                + usersArray[0][0]
                + " has id "
                + newInviteId
            );
        }

        return newChatRoomId;

    },

    // TODO Make this do something other than just let the user enter the chat room
    /**
     * Create access level for user
     * @param {Number} userId - ID of user
     * @param {Number} chatRoomId - ID of chat room
     * @returns {Number} ID of new ChatRoomAccessLevels doc
     */
    createChatRoomAccessLevel: function (userId, chatRoomId) {
        return ChatRoomsAccessLevels.insert({
                adminId: Meteor.userId(),
                userId: userId,
                chatRoomId: chatRoomId
            });
    },

    /**
     * Create chat room invite for user
     * @param {Number} userId - ID of user
     * @param {Number} chatRoomId - ID of chat room
     * @param {String} inviterName - User name of chat room inviter
     * @param {String} inviteMessage - Message to display in invite
     * @returns {Number} ID of new ChatRoomInvites doc
     */
    createChatRoomInvite: function (userId, chatRoomId, inviterName, inviteMessage) {
        return ChatRoomsInvites
            .insert({
                userId: userId,
                chatRoomId: chatRoomId,
                inviterName: inviterName,
                inviteMessage: inviteMessage
            }
        );
    },

    // TODO Hide chat rooms that the user does not have access to (not invited, banned, etc.)
    /**
     * Returns a list of all chat rooms.
     * @returns {Mongo.Cursor} List of all chat rooms
     */
    getChatRooms: function () {
        return ChatRooms.find({});
    },

    // TODO Clean this up
    /**
     * Returns a list of all chat room invites.
     * @returns {Mongo.Cursor} List of all chat room invites
     */
    getChatRoomsInvites: function () {
        return ChatRoomsInvites.find({});
    },

    /**
     * Returns count of all of the user's unaccepted/undeclined invites
     * @returns {Number} Number of unaccepted/undeclined invites
     */
    getChatRoomsInvitesCount: function () {
        return ChatRoomsInvites.find({userId: Meteor.userId()}).count();
    },

    /**
     * Accepts an invitation and switches to attached room
     * @param inviteId - ID of chat room invite
     */
    acceptInvite: function(inviteId) {
        GameChatClient
            .setCurrentRoomId(ChatRoomsInvites.findOne({_id: inviteId}).chatRoomId);
        ChatRoomsInvites.remove(inviteId);
    },

    /**
     * Declines an invitation
     * @param inviteId - ID of chat room invite
     */
    declineInvite: function(inviteId) {
        ChatRoomsInvites.remove(inviteId);
    },

    /**
     * Returns the ID of the client's currently active chat room
     * @returns {Number} ID of client's currently active chat room
     */
    getCurrentRoomId: function () {
        return Session.get("currentRoomId")
    },

    /**
     * Returns a list of all users that are currently online.
     * @returns {Mongo.Cursor} List of all users that are currently online
     */
    getOnlineUsers: function () {
        return Meteor.users.find({ "status.online": true , _id: {$ne: Meteor.userId()} });
    },

    // TODO Clean this up
    /**
     * Sends a message from the user to a chat room.
     * @param {Number} roomId - Id of chat room to update with message
     * @param {String} message - Contents of user's message
     * @returns True if successful
     */
    sendChatMessage: function (roomId, message) {
        // Grab user info
        var messageUserId = Meteor.userId();
        var messageUserName = Meteor.user().username;
        var messageDate = Date.now();

        return ChatRooms
            .update(/* messageUserId,*/ roomId, /*['messages'],*/ {$push:{messages: {
                name: messageUserName,
                text: message,
                createdAt: messageDate
            }
            }
            });
    },

    /**
     * Sets the ID of the client's currently active room
     * @param {Number} newCurrentRoomId - ID of the client's new currently active room
     */
    setCurrentRoomId: function (newCurrentRoomId) {
        Session.set("currentRoomId", newCurrentRoomId);
    },

    // TODO
    /**
     * Unban user from chat room
     * @param {Number} userId - ID of user
     * @param {Number} chatRoomId - ID of chat room
     * @returns {Boolean} True if successful
     */
    unbanUserFromChatRoom: function (userId, chatRoomId) {
        return null;
    }
};
