/* global UserInfo */
/* global GameList */
/* global Meteor */
/* global Accounts */
/* global Template */
/* global Mongo */

GameList = new Mongo.Collection("games");
UserInfo = new Mongo.Collection("userInfo");

if (Meteor.isClient) {
	Meteor.subscribe("games");
	Meteor.subscribe("userinfo");

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});

	Meteor.autorun(function () {
		if (Meteor.user()) {
			var userInfo = UserInfo.find().fetch();
			if (!userInfo[0]) {
				var userObj = { "username": Meteor.user().username, "inGame": false };
				Meteor.call("addUser", userObj);
			}
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});

	Meteor.publish("games", function () {
		return GameList.find();
	});

	Meteor.publish("userinfo", function () {
		var userId = this.userId;
		if (userId) {
			var username = Meteor.users.findOne(userId).username;
			return UserInfo.find({ "username": username });
		}
	});
}