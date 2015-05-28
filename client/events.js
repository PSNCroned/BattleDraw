Template.body.events({
	"submit #joinGame": function (event, form) {
		event.preventDefault();
		var gameId = form.find("#gameId").value;
		Meteor.call("joinGame", gameId);
	},
	"submit #createGame": function (event, form) {
		event.preventDefault();
		var maxPlayers = 2;
		Meteor.call("createGame", maxPlayers, function (error, result) {
			console.log("Created game: " + result);
			Meteor.call("joinGame", result);
		});
	},
	"click #leaveGame": function () {
		Meteor.call("leaveGame");
	}
});