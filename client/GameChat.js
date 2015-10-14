// Holds list of users to invite to roomGameChatClientLists = {};Accounts.ui.config({   passwordSignupFields: 'USERNAME_AND_EMAIL'});Tracker.autorun(function () {    Meteor.subscribe("chatrooms");    Meteor.subscribe("onlusers");    Meteor.subscribe("chatroomsinvites");		Meteor.subscribe("allusers");});Template.mainNav.helpers({    'invitecount': function () {        var currentInvitesCount = GameChatClient.getChatRoomsInvitesCount();        if (currentInvitesCount > 0) {            return '(' + currentInvitesCount + ')';        } else {            return '';        }    }});Template.dashboardpage.helpers({	user: function(){		return Meteor.users.find();	 }});Template.dashboardpage.helpers({	usercount: function(){		return Meteor.users.find().count();	}});Template.dashboardpage.helpers({	'click .deleteuser': function () {        meteor.users.remove({_id:this._id})     },});Template.roompage.helpers({    'chatrooms':function () {        return GameChatClient.getChatRooms();    }});Template.roompage.events({    'click .room': function () {        GameChatClient.setCurrentRoomId(this._id);        console.log("Current room is now " + GameChatClient.getCurrentRoomId());    }});Template.roomcreatepage.helpers({    'onlusr':function () {        return GameChatClient.getOnlineUsers();    }});Template.roomcreatepage.events({    'click .toggle-user-checked': function () {        if (GameChatClientLists.newRoomInviteList === undefined) {            console.log(".toggle-user-checked: newRoomInviteList is undefined, creating new list");            GameChatClientLists.newRoomInviteList = new Map();        }        // TODO Add different permission values (moderator, etc.)        // Add/remove user from invite list        if(!this.userchecked) {            console.log(".toggle-user-checked: Setting userId " + this._id);            GameChatClientLists.newRoomInviteList.set(this._id, "user");            console.log(".toggle-user-checked: userId "                + this._id                + " now has value "                + GameChatClientLists.newRoomInviteList.get(this._id)            );            this.userchecked = (!this.userchecked);        } else {            console.log(".toggle-user-checked: Deleting userId " + this._id);            GameChatClientLists.newRoomInviteList.delete(this._id);            this.userchecked = (!this.userchecked);        }    },    'click .toggle-public-checked': function () {        if (GameChatClientLists.newRoomFlags === undefined) {            console.log(".toggle-checked: newRoomInviteList is undefined, creating new list");            GameChatClientLists.newRoomFlags = new Map();        }        // TODO Add different permission values (moderator, etc.)        // Add/remove user from invite list        if(!this.publicchecked) {            console.log(".toggle-checked: Setting room to public");            GameChatClientLists.newRoomFlags.set('isPublic', true);            this.publicchecked = (!this.publicchecked);        } else {            console.log(".toggle-checked: Setting room to private");            GameChatClientLists.newRoomFlags.set('isPublic', false);            this.publicchecked = (!this.publicchecked);        }    },    'click .createroom': function () {        // TODO get rid of this thing        if (GameChatClientLists.newRoomInviteList !== undefined) {            console.log(".createroom: GameChatClientLists.newRoomInviteList is defined and has size "                        + GameChatClientLists.newRoomInviteList.size);        }        function printInvites(value, key, map) {            console.log("userId " + key + " has access level " + value);        }        GameChatClientLists.newRoomInviteList.forEach(printInvites);        // Grab desired name for new room        var newRoomName = document.getElementById('newroomname');        // Create empty invite list f user didn't invite anyone        if (GameChatClientLists.newRoomInviteList === undefined) {           GameChatClientLists.newRoomInviteList = new Map();        }        // Set room to private if user didn't set it explicitly        if (GameChatClientLists.newRoomFlags === undefined        ) {            GameChatClientLists.newRoomFlags = new Map();        }        if (GameChatClientLists.newRoomFlags.get('isPublic') === undefined) {            GameChatClientLists.newRoomFlags.set('isPublic', false);        }        // Create the chat room        console.log(".createroom: calling createChatRoom(), newRoomName=" + newRoomName.value);        GameChatClient.createChatRoom(            newRoomName.value,            GameChatClientLists.newRoomInviteList,            GameChatClientLists.newRoomFlags        );        // Clear newRoomInviteList and newRoomFlags (values no longer needed)        GameChatClientLists.newRoomInviteList.clear();        GameChatClientLists.newRoomFlags.clear();    }});Template.roomadminpage.helpers({    'allowedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var bannedCurrentUsers = currentChatRoom.accessBanned;        var allowedCurrentUsers = currentChatRoom.accessRegular        if (currentChatRoom.isPublic) {            return Meteor.users.find({"status.online": true, _id: {$nin: bannedCurrentUsers}});        } else {            return Meteor.users.find({"status.online": true, _id: {$in: allowedCurrentUsers}});        }    },    'uninvitedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var invitedCurrentUsers = currentChatRoom.invited;        return Meteor.users.find({            "status.online": true ,            $and: [{_id:{$nin: invitedCurrentUsers}}, {_id: {$ne: Meteor.userId()}} ]        });    },    'bannedcurrentusr': function () {        var currentChatRoom = ChatRooms.findOne(GameChatClient.getCurrentRoomId());        var bannedCurrentUsers = currentChatRoom.accessBanned;        return Meteor.users.find({ "status.online": true , _id: {$in: bannedCurrentUsers} });    },});Template.roomadminpage.events({    'click .banuser': function () {        console.log("roomadminpage.events.banuser: Banning userId " + this._id);        GameChatClient.banUserFromChatRoom(            this._id,            GameChatClient.getCurrentRoomId()        );    },    'click .inviteuser': function () {        console.log("roomadminpage.events.inviteuser: Inviting userId " + this._id);        GameChatClient.inviteUserToChatRoom(            this._id,            GameChatClient.getCurrentRoomId()        );    },    'click .unbanuser': function () {        console.log("roomadminpage.events.unbanuser: Unbanning userId " + this._id);        GameChatClient.allowUserIntoChatRoom(            this._id,            GameChatClient.getCurrentRoomId()        );    }});Template.invitespage.helpers({    'chatroomsinvite': function () {        return GameChatClient.getChatRoomsInvites();    },});Template.invitespage.events({    'click .acceptinvite': function () {        GameChatClient.acceptInvite(this._id);    },    'click .declineinvite': function () {        GameChatClient.declineInvite(this._id);    },});Template.sidebar.helpers({    'onlusr':function () {        return GameChatClient.getOnlineUsers();    }});Template.sidebar.events({    'click .user':function(){        // TODO Remove (only used for debugging)        console.log('this._id before room existence check: ' + this._id);        console.log('userId: ' + Meteor.userId());        var res=ChatRooms.findOne({chatIds:{$all:[this._id,Meteor.userId()]}});        if(res) {            //already room exists            GameChatClient.setCurrentRoomId(res._id);        }        else {            //no room exists            var newRoom = ChatRooms.insert({chatIds:[this._id , Meteor.userId()],messages:[]});            // TODO Remove (only used for debugging)            console.log('this._id after room existence check (did not exist): ' + this._id);            GameChatClient.setCurrentRoomId(newRoom);        }    }});Template.messages.helpers({    'msgs':function() {        var result = ChatRooms.findOne({_id:GameChatClient.getCurrentRoomId()});        return result.messages;    }});Template.input.events = {    'keydown input#message' : function (event) {    if (event.which == 13) {        if (Meteor.user()) {            var message = document.getElementById('message');            if (message.value !== '') {                // Send the message                GameChatClient.sendChatMessage(GameChatClient.getCurrentRoomId(), message.value);                // Clear the contents of the message field                document.getElementById('message').value = '';                message.value = '';            }        }        else        {           alert("login to chat");        }    }  }}