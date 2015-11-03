// TODO Delete this if I can't find a use for it/** * Global functions used by the GameChat client and server * to perform operations that require server data. * @namespace */GameChatServer = {};Meteor.startup(function() {    // TODO Create site admin that can ban users from public chat    // Create Home chat room (public)    if (!ChatRooms.findOne({roomname: 'Public Chat'}))    ChatRooms.insert({            adminId: null,            roomname: 'Public Chat',            isPublic: true,            accessRegular:[],            accessBanned:[],            messages:[],            currentUsers:[]    });    ChatRooms.allow({        'insert': function(userId, doc){            return true;        },        // TODO: Move messaging stuff to Meteor.methods, it's a potential security issue        'update': function(userId, doc, fieldNames, modifier){            // Allow users to modify chat rooms that they create            // Allow server to modify chat room            if (doc.adminId == userId || Meteor.isServer) {                return true;            }            // TODO Confirm that messaging is the only allowed update for other users            // TODO Confirm that extra var if necessary, remove if it isn't            // Allow all permitted users to send messages            var fieldNamesToModify = fieldNames;            if (fieldNamesToModify.pop() === 'messages') {                // If the user wants to do something other than send messages, return false                if (fieldNamesToModify.length > 0) {                    return false;                }                // If room is public and user isn't banned then return true                if (doc.isPublic                    && doc.accessBanned.indexOf(userId) === -1                ) {                    return true;                }                // If user is in regular list and not banned then return true                if ((doc.accessRegular.indexOf(userId) !== -1)                    && (doc.accessBanned.indexOf(userId) === -1)) {                    return true;                }            }            // If previous checks fail then user is not permitted, return false            return false;        },        'remove':function(userId,doc){            return doc.adminId === userId;        }        // TODO Prevent users from generating their own _id        //'transform': {$set: {ownerId: this.userId} }    });    // TODO Prevent users from generating their own _id    // TODO Limit access to invites actually belonging to the user    ChatRoomsInvites.allow({        'insert': function(userId, doc) {            return true;        },        'update': function(userId, doc, fieldNames, modifier) {            return true;        },        'remove': function(userId, doc) {            return true;        },        // TODO Prevent users from generating their own _id        //'transform': {$set: {ownerId: this.userId} }    });    // TODO Limit access to site admin(s)    Games.allow({        'insert': function(userId, doc) {            return true;        },        'update': function(userId, doc, fieldNames, modifier) {            return true;        },        'remove': function(userId, doc) {            return true;        },    });    Meteor.methods({        /**         * @function joinChatRoom         * @memberof Meteor.methods         * @desc Joins the calling user to a chat room if they're permitted         * @param {Number} chatRoomId - Id of chat room         */        joinChatRoom: function(chatRoomId) {            var doc = ChatRooms.findOne(chatRoomId);            if ((doc.isPublic                && doc.accessBanned.indexOf(this.userId) === -1)            ||               ((doc.accessRegular.indexOf(this.userId) !== -1)                && (doc.accessBanned.indexOf(this.userId) === -1))            ) {                return ChatRooms.update(chatRoomId,                    {$push:{currentUsers:this.userId}});            }        },        /**         * @function leaveChatRoom         * @memberof Meteor.methods         * @desc Removes the calling user from a chat room if they're currently in it         * @param {Number} chatRoomId - Id of chat room         */        leaveChatRoom: function(chatRoomId) {            return ChatRooms.update(chatRoomId, {$pull:{currentUsers:this.userId}});        }    });});