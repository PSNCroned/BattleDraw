Template.body.helpers({
	"showLeave": function() {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = false;
		}
		
		if (inGame) {
			return true;
		}
		else {
			return false;
		}
	}
});

Template.form.helpers({
	"display": function () {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = true;
		}
		
		if (inGame) {
			return false;
		}
		else {
			return true;
		}
	}
});

Template.game.helpers({
	"display": function () {
		var inGame;
		if (Meteor.user()) {
			inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			inGame = false;
		}
		if (inGame) {
			return true;
		}
		else {
			return false;
		}
	},
	"hostName": function() {
		return GameList.find(UserInfo.find().fetch()[0].gameId).fetch()[0].host;
	},
	"countDown": function() {
		return GameList.find(UserInfo.find().fetch()[0].gameId).fetch()[0].countDown;
	},
	"showCountDown": function() {
		var Game = GameList.find(UserInfo.find().fetch()[0].gameId).fetch()[0];
		if (Game.hasStarted == true && Game.countDown > 0) {
			return true;
		}
		else {
			return false;
		}
	}
});