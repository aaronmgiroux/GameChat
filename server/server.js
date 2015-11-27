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
    checkChatRoomPermission: function (chatRoomId, userId) {
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

    // TODO Create initial site admins using config file
    GameChatServer.createInitAdmin(
        Meteor.settings.initadmin_username.toString(),
        Meteor.settings.initadmin_password.toString(),
        Meteor.settings.initadmin_email.toString()
    );

    ChatRooms.allow({

        // TODO Prevent users from generating their own _id
        'insert': function(userId, doc){
            //Do not allow chat room admins to insert messages themselves
            return doc.messages.length === 0;
        },

        'update': function(userId, doc, fieldNames, modifier){

            // Allow users to modify chat rooms that they create
            // (except for messages: even chatroom admins should have to go through Meteor.methods)
            if (doc.adminId === userId && fieldNames.indexOf('messages') === -1) {
                return true;
            }

            // If previous checks fail then user is not permitted, return false
            return false;
        },

        'remove':function(userId,doc){
            return doc.adminId === userId || GameChatServer.userIsAdmin(userId);
        }

    });


    // TODO Prevent users from generating their own _id
    // TODO Limit access to invites actually belonging to the user
    ChatRoomsInvites.allow({

        'insert': function(userId, doc) {
            return doc.inviterName === Meteor.users.findOne(userId).username;
        },

        'update': function(userId, doc, fieldNames, modifier) {
            return doc.userId === userId;
        },

        'remove': function(userId, doc) {
            return doc.userId === userId;
        }

    });

    // TODO Limit access to site admin(s)
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
                // Don't allow normal users to change anyone's admin status
                // Don't allow init admin to demote themselves through web interface
                if (fieldNames.indexOf('isAdmin') !== -1) {
                    if (doc._id !== GameChatServer.initadminId) {
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

        'remove': function(userId, doc) {
            // Only let admins remove user accounts
            if (doc._id == GameChatServer.initadminId || doc._id === GameChatServer.initadminId) {
                return false;
            } else {
                return GameChatServer.userIsAdmin(userId);
            }
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
        }

        // TODO
        /* ===== Friend Methods ===== */

        /**
         * @function sendFriendRequest
         * @memberof Meteor.methods
         * @desc Places a friend request in the Invites queue
         * @param
         * @param
         */
    });
});