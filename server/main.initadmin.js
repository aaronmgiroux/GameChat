// Create the init admin
GameChatServer.createInitAdmin(
    Meteor.settings.initadmin_username.toString(),
    Meteor.settings.initadmin_password.toString(),
    Meteor.settings.initadmin_email.toString()
);
