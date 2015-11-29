Meteor.publish("chatrooms",function() {    return ChatRooms.find({        $or: [            {                $and: [                    { accessRegular: { $in: [this.userId] } },                    { accessBanned: { $nin: [this.userId] } }                ]            },            {                $and: [                    { isPublic: true },                    { accessBanned: { $nin: [this.userId] } }                ]            },            { adminId: this.userId }        ]    });});Meteor.publish("chatroomsinvites",function(){    return ChatRoomsInvites.find({userId: this.userId});});Meteor.publish("onlusers",function(){    return Meteor.users.find({"status.online":true},{username:1});});Meteor.publish("allusers", function () {              return Meteor.users.find({userId:{$ne:this.userId}}, {fields: {username: 1, emails: 1, profile: 1, isAdmin: 1}});});Meteor.publish("games", function () {   return Games.find({});});Meteor.publish("friends", function () {    return Friends.find({userId:this.userId});});