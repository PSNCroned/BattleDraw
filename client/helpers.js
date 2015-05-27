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
		return GameList.find({_id: UserInfo.find().fetch()[0].gameId}).fetch()[0].host;
	}
});