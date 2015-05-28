/* global Tracker */
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

	setInterval(function () {
		if (Meteor.user()) {
			var userInfo = UserInfo.find().fetch();
			if (!userInfo[0]) {
				var userObj = { "username": Meteor.user().username, "inGame": false };
				Meteor.call("addUser", userObj);
			}
			
			var userInfoFetch = UserInfo.find({"username": Meteor.user().username}).fetch()[0];
			if (userInfoFetch.inGame) {
				var game = GameList.find({"_id": userInfoFetch.gameId}).fetch()[0];
				
				if (game.numPlayers == game.maxPlayers && game.host == Meteor.user().username && !game.hasStarted) {
					Meteor.call("startGame", game._id);
				}
				Meteor.call("updateCountDown", game._id);
			}
		}
	}, 100);
	
	setInterval(function() {
		if (Meteor.user()) {
			var userInfoFetch = UserInfo.find({"username": Meteor.user().username}).fetch()[0];
			if (userInfoFetch.inGame) {
				var game = GameList.find({"_id": userInfoFetch.gameId}).fetch()[0];
				if (game.countDown > 0) {
					Meteor.call("updateCountDown", game._id);
				}
			}
		}
	}, 1000);
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