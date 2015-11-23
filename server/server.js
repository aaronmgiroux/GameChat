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
        )
    },

    // TODO Highly insecure and brittle - Need to update this to use config files
    /**
     * @function userIsAdmin
     * @memberof GameChatServer
     * @desc Checks to see if user is admin.
     * @param {String} userId - Mongo ID of user
     * @returns {Boolean} True is user is admin, false otherwise
     */
    userIsAdmin: function(userId) {
        return (
            Meteor.users.findOne(userId).username == 'dnsulliv'
            ||
            Meteor.users.findOne(userId).username == 'aaron'
            ||
            Meteor.users.findOne(userId).username == 'admin'
        );
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

    ChatRooms.allow({

        'insert': function(userId, doc){
            //Do not allow chat room admins to insert messages themselves
            return doc.messages.length === 0;
        },

        'update': function(userId, doc, fieldNames, modifier){

            // Allow users to modify chat rooms that they create
            // (except for messages: even chat admins should have to go through Meteor.methods)
            // Allow server to modify chat room
            if (doc.adminId === userId && fieldNames.indexOf('messages') === -1) {
                return true;
            }

            // If previous checks fail then user is not permitted, return false
            return false;
        },

        'remove':function(userId,doc){
            return doc.adminId === userId;
        }

        // TODO Prevent users from generating their own _id
        //'transform': {$set: {ownerId: this.userId} }
    });

    // TODO Prevent users from generating their own _id
    // TODO Limit access to invites actually belonging to the user
    ChatRoomsInvites.allow({

        'insert': function(userId, doc) {
            return true;
        },

        'update': function(userId, doc, fieldNames, modifier) {
            return true;
        },

        'remove': function(userId, doc) {
            return true;
        },

        // TODO Prevent users from generating their own _id
        //'transform': {$set: {ownerId: this.userId} }
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
	
    // Allow user delete from dashboard page on delete click
    Meteor.users.allow({

        // TODO Prevent users from modifying user docs that are not their own
        'update': function(userId, doc, fieldNames, modifier) {
            return (fieldNames.indexOf('isAdmin') && GameChatServer.userIsAdmin(userId) === true)
                || Meteor.isServer;
        },
	    remove: function (userId, doc) {
			if(doc.username == 'admin' || doc.username == 'aaron' || doc.username == 'dnsulliv'){
				return false;   
			}
			else{
				return true;    
			}	    
		},
		//'remove': function (userId, doc) {
            //return GameChatServer.userIsAdmin(userId);
	    //}
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