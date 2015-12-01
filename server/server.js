// TODO Delete this if I can't find a use for it
/**
 * @namespace GameChatServer
 * @desc Global functions used by the GameChat client and server
 * to perform operations that require server data.
 */

GameChatServer = {
    /**
     * @function checkChatRoomPermission
     * @member GameChatServer
     * @desc Checks to see if a regular user (not room admin)
     * has permission to use a chat room
     * @param {String} chatRoomId - Mongo ID of chat room
     * @param {String} userId - Mongo ID of user
     */
    checkChatRoomPermission: function(chatRoomId, userId) {
        var doc = ChatRooms.findOne(chatRoomId);

        return (
        (doc.isPublic && doc.accessBanned.indexOf(userId) === -1)
        ||
        (doc.accessRegular.indexOf(userId) !== -1 && doc.accessBanned.indexOf(userId) === -1)
        ||
        (doc.adminId === userId)
        );
    },

    /**
     * @function userIsAdmin
     * @memberof GameChatServer
     * @desc Checks to see if user is admin.
     * @param {String} userId - Mongo ID of user
     * @returns {Boolean} True is user is admin, false otherwise
     */
    userIsAdmin: function(userId) {
        return Meteor.users.findOne(userId).isAdmin;
    },

    /* ===== INIT ADMIN FUNCTIONS ===== */

    /**
     * @function createInitAdmin
     * @memberof GameChatServer
     * @desc Creates or updates the init admin account for the GameChat server.
     * This account cannot be deleted or demoted to non-admin while the server is running.
     * The server must be restarted with an updated gamechat_settings.json file
     * in order to edit the init admin role.
     * This function is intended to be run ONCE upon server start, and never called
     * by the clients.
     * Please refer to gamechat_settings_template.json for guidance on creating
     * gamechat_settings.json.
     * @param {String} initAdminUsername - Username of init admin
     * @param {String} initAdminPassword - Password for init admin
     * @param {String} initAdminEmail - Email address for init admin
     */
    createInitAdmin: function(initAdminUsername, initAdminPassword, initAdminEmail) {
        console.log("createInitAdmin(): now running");

        // Create init admin if account does not exist
        if (Meteor.users.find({username: Meteor.settings.initadmin_username}).count() == 0) {
            GameChatServer.initadminId
                = Meteor.users.insert(
                {
                    username: initAdminUsername,
                    emails: [{address: initAdminEmail, verified: true }],
                    profile: {},
                    isAdmin: true
                },
                function(err, iaId) {
                    if (err) {
                        console.log(
                            "createInitAdmin(): initadmin user doc creation failed. err: "
                            + err
                        );
                    } else {
                        console.log(
                            "createInitAdmin(): initadmin user doc creation succeeded."
                            + " _id: "
                            + iaId
                            + ". Will now attempt to set password"
                        );
                        Accounts.setPassword(iaId, initAdminPassword, {logout:false});
                    }
                }
            );
        } else { // Set id of initadmin if it already exists
            GameChatServer.initadminId
                = Meteor.users.findOne({username: Meteor.settings.initadmin_username})._id;
            Meteor.users.findOne(GameChatServer.initadminId).isAdmin = true;
            console.log("createInitAdmin: User in settings already exists."
                + " Init admin id has been set to userId of this account - "
                + GameChatServer.initadminId
            );
        }
    }
};

Meteor.startup(function() {

    // TODO Create site admin that can ban users from public chat
    // Create Home chat room (public)
    if (!ChatRooms.findOne({roomname: 'Public Chat'}))
    ChatRooms.insert({
            adminId: null,
            roomname: 'Public Chat',
            isPublic: true,
            gameId: null,
            accessRegular:[],
            accessBanned:[],
            messages:[],
            currentUsers:[]
    });

    // TODO Prevent users from generating their own _id
    ChatRooms.allow({

        'insert': function(userId, doc){
            //Do not allow chat room admins to insert messages themselves
            return doc.messages.length === 0 && doc.adminId === userId;
        },

        'update': function(userId, doc, fieldNames, modifier){

            // Allow users to modify chat rooms that they create
            // (except for messages: even chatroom admins should have to go through Meteor.methods)
            if ((doc.adminId === userId || GameChatServer.userIsAdmin(userId))
                && fieldNames.indexOf('messages') === -1) {
                return true;
            }

            // If previous checks fail then user is not permitted, return false
            return false;
        },

        // Allow chat room admin and site admins to remove rooms
        'remove':function(userId,doc){
            return doc.adminId === userId || GameChatServer.userIsAdmin(userId);
        }

    });


    // TODO Prevent users from generating their own _id
    // TODO Limit access to invites actually belonging to the user
    ChatRoomsInvites.allow({

        'insert': function(userId, doc) {
            /* Require invites inserted directly by user to be in user's name
             * and only for chat room invites (friend requests must go through server)
             */
            return (doc.inviterName === Meteor.users.findOne(userId).username
                    &&
                    doc.chatRoomId != null);
        },

        // No need to update an existing invite at this time
        'update': function(userId, doc, fieldNames, modifier) {
            return false;
        },

        // Allow users to remove invites sent to them
        'remove': function(userId, doc) {
            return doc.userId === userId;
        }

    });

    Games.allow({

        'insert': function(userId, doc) {
            return GameChatServer.userIsAdmin(userId);
        },

        'update': function(userId, doc, fieldNames, modifier) {
            return GameChatServer.userIsAdmin(userId);
        },

        'remove': function(userId, doc) {
            return GameChatServer.userIsAdmin(userId);
        }

    });

    // TODO Correct permissions
    Friends.allow({

        'insert': function(userId, doc) {
            return false;
        },

        'update': function(userId, doc, fieldNames, modifier) {
            return false;
        },

        'remove': function(userId, doc) {
            return false;
        }
    });

    Meteor.users.allow({

        // Allow account creation if account doesn't start as admin
         'insert': function(userId, doc) {
            return doc.isAdmin == null;
        },

        'update': function(userId, doc, fieldNames, modifier) {
            // Give the init admin full access (except for demoting themselves)
            if (userId === GameChatServer.initadminId) {
                if (doc._id === GameChatServer.initadminId) {
                    if (fieldNames.indexOf('isAdmin') !== -1) {
                        return false;
                    }
                }
                return true;
            }

            if (doc._id === userId) {
                if (fieldNames.indexOf('isAdmin') !== -1) {
                    // Don't allow init admin to demote themselves through web interface
                    if (doc._id !== GameChatServer.initadminId) {
                        // Don't allow normal users to change anyone's admin status
                        return GameChatServer.userIsAdmin(userId);
                    } else {
                        return false;
                    }
                } else {
                    // Let users modify their own account docs (EXCEPT for isAdmin field)
                    return true;
                }
            }

            // Let admins modify other user's accounts (EXCEPT for init admin account)
            return GameChatServer.userIsAdmin(userId) && doc._id !== GameChatServer.initadminId;
        },

        // Only allow account deletions through Meteor.methods
        'remove': function(userId, doc) {
            return false;
        }
    });

    Meteor.methods({

        /**
         * @function joinChatRoom
         * @memberof Meteor.methods
         * @desc Joins the calling user to a chat room if they're permitted
         * @param {String} chatRoomId - Id of chat room
         */
        joinChatRoom: function (chatRoomId) {
            if (GameChatServer.checkChatRoomPermission(chatRoomId, this.userId)
                &&
                ChatRooms.findOne(chatRoomId).currentUsers.indexOf(this.userId) === -1) {
                ChatRooms.update(chatRoomId,
                    {$push: {currentUsers: this.userId}});
            }
        },

        /**
         * @function leaveChatRoom
         * @memberof Meteor.methods
         * @desc Removes the calling user from a chat room if they're currently in it
         * @param {String} chatRoomId - Id of chat room
         */
        leaveChatRoom: function (chatRoomId) {
            ChatRooms.update(chatRoomId, {$pull: {currentUsers: this.userId}});
        },

        /**
         * @function sendNewChatMessage
         * @memberof Meteor.methods
         * @desc Inserts user message into chat room array if they're permitted
         * @param {String} message - User message
         * @param {String} chatRoomId - ID of chat room
         */
        sendNewChatMessage: function (chatRoomId, message) {
            if (GameChatServer.checkChatRoomPermission(chatRoomId, this.userId)) {

                // Grab user info
                var messageUserName = Meteor.users.findOne({_id: this.userId}).username;
                var messageDate = Date.now();

                ChatRooms.update(
                    chatRoomId,
                    {
                        $push: {
                            messages: {
                                name: messageUserName,
                                text: message,
                                createdAt: messageDate
                            }
                        }
                    }
                );
            } else {
                return 0;
            }
        },

        /* ===== Friend Methods ===== */

        /**
         * @function sendFriendRequest
         * @memberof Meteor.methods
         * @desc Places a friend request in the Invites queue
         * @param {String} friendUserId - ID of user for which to create request
         */
        sendFriendRequest: function (friendUserId) {
            console.log("Meteor.methods.sendFriendRequest(): Now running");
            var requesterDocId = null;

            // Make sure this user actually exists
            if (Meteor.users.find(friendUserId).count() === 0) {
                console.log("Meteor.methods.sendFriendRequest(): " +
                            + "friendUserId does not exist, returning");
                return;
            }

            // Create Friends doc for requestor if it doesn't already exist
            if (Friends.find({userId:this.userId}).count() === 0) {
                console.log("Meteor.methods.sendFriendRequest(): "
                            + "Creating Friends list for requester userId "
                            + this.userId);
                requesterDocId = Friends.insert(
                    {
                        userId:this.userId,
                        requestsOpen:[],
                        requestsDenied:[],
                        friends:[]
                    }
                );
            } else {
                requesterDocId = Friends.findOne({userId:this.userId})._id;
                console.log("Meteor.methods.sendFriendRequest(): "
                            + "Friends list for requester exists and has id "
                            + friendUserId);
            }

            // Create Friends doc for requestee if it doesn't already exist
            if (Friends.find({userId:friendUserId}).count() === 0) {
                console.log("Meteor.methods.sendFriendRequest(): "
                            + "Creating Friends list for requestee userId "
                            + friendUserId);
                Friends.insert(
                    {
                        userId:friendUserId,
                        requestsOpen:[],
                        requestsDenied:[],
                        friends:[]
                    }
                );
            }

            /* Create friend request if the following criteria are met:
             *
             * 1. User is not already a Friend of the requestee
             * 2. User has not already created a Friend request for this requestee
             * 3. Requestee has not already denied a friend requests for this user
             */

            if (Friends.findOne(requesterDocId).friends.indexOf(friendUserId === -1)
                &&
                Friends.findOne(requesterDocId).requestsOpen.indexOf(friendUserId) === -1
                &&
                Friends.findOne(requesterDocId).requestsDenied.indexOf(friendUserId) === -1) {

                console.log("Meteor.methods.sendFriendRequest(): "
                            + "Creating Friend request invite for requestee userId "
                            + friendUserId);
                ChatRoomsInvites.insert(
                    {
                        userId:friendUserId,
                        chatRoomId:null,
                        inviterName:Meteor.users.findOne(this.userId).username,
                        inviteMessage:" wants to be your friend"
                    }
                );
                console.log("Meteor.methods.sendFriendRequest(): "
                    + "Adding friendUserId "
                    + friendUserId
                    + " to userId "
                    + this.userId
                    + " requestsOpen list");
                Friends.update({userId:this.userId},{$push:{requestsOpen:friendUserId}});
            } else {
                console.log("Meteor.methods.sendFriendRequest(): "
                + "Friend request from "
                + this.userId
                + " for user "
                + friendUserId
                + " already exists");
            }
        },

        /**
         * @function acceptFriendRequest
         * @memberof Meteor.methods
         * @desc Accept a friend request
         * @param {String} friendId - ID of new friend
         */
        acceptFriendRequest: function (friendId) {

            console.log("Meteor.methods.acceptFriendRequest(): Now running");

            // Add acceptee's userId to accepter's friends list
            Friends.update({userId:this.userId},{$push:{friends:friendId}});

            // Add accepter's userId to acceptee's friends list
            Friends.update({userId:friendId},{$push:{friends:this.userId}});

            // Remove request from accepter's open requests list
            Friends.update({userId:friendId},{$pull:{requestsOpen:this.userId}});

            // Remove any request denials from history
            Friends.update({userId:friendId},{$pull:{requestsDenied:this.userId}});
            Friends.update({userId:this.userId},{$pull:{requestsDenied:friendId}});
        },

        /**
         * @function denyFriendRequest
         * @memberof Meteor.methods
         * @desc Deny a friend request
         * @param {String} notFriendId - ID of friend requester being denied
         */
        denyFriendRequest: function (notFriendId) {

            console.log("Meteor.methods.denyFriendRequest(): Now running");

            // Remove request from requester's open request list
            Friends.update({userId:notFriendId},{$pull:{requestsOpen:this.userId}});

            // Put requestee's userId into denied requests list of requester
            Friends.update({userId:notFriendId},{$push:{requestsDenied:this.userId}});
        },

        /* ===== Admin Functions ===== */
        /**
         * @function deleteAccount
         * @memberof Meteor.methods
         * @desc Delete a user account.
         * @param {String} userId - ID of account to delete
         */
        deleteAccount: function (userId) {
            // Do not allow the init admin to be deleted
            if (userId !== GameChatServer.initadminId) {
                // Only let admins remove user accounts
                if (GameChatServer.userIsAdmin(this.userId)) {
                    Meteor.users.remove(userId);
                }
            }
        },

        /**
         * @function toggleUserAdmin
         * @memberof Meteor.methods
         * @desc Toggles the admin status of another user. User MUST be admin.
         * @param {String} userId - ID of user for whom to toggle admin status
         */
        toggleUserAdmin: function (userId) {
            if (GameChatServer.userIsAdmin(this.userId) && GameChatServer.initadminId !== userId) {
                var currentStatus = Meteor.users.findOne(userId).isAdmin;
                var newStatus;
                if (currentStatus === null || currentStatus === undefined || currentStatus === false) {
                    newStatus = true;
                } else {
                    newStatus = false;
                }
                Meteor.users.update(userId, {$set:{isAdmin:newStatus}});
            }
        }
    });
});