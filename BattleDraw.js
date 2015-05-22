GameList = new Mongo.Collection("games");
UserInfo = new Mongo.Collection("userInfo");

if (Meteor.isClient) {
	Meteor.subscribe("games");
	Meteor.subscribe("userinfo");

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
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
		return UserInfo.find();
	});
}
