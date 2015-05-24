Template.body.events({
	"submit #joinGame": function (event, form) {
		event.preventDefault();
		var gameId = form.find("#gameId").value;
		var username = Meteor.user().username;
		var infoObj = {
			"gameId": gameId,
			"username": username,
		};
		Meteor.call("joinGame", infoObj);
	},
	"submit #createGame": function (event, form) {
		event.preventDefault();
		var host = Meteor.user().username;
		var maxPlayers = 4;
		var infoObj = {
			"host": host,
			"maxPlayers": maxPlayers
		}
		Meteor.call("createGame", infoObj, function (error, result) {
			console.log(result);
			Meteor.call("joinGame", {
				"gameId": result,
				"username": Meteor.user().username
			});
		});
	}
});