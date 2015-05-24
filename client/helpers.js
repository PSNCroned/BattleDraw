Template.form.helpers({
	"display": function () {
		if (Meteor.user()) {
			var inGame = UserInfo.find({ "username": Meteor.user().username }).fetch()[0].inGame;
		}
		else {
			var inGame = true;
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

	}
});