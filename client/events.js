Template.body.events({
	"click #leaveGame": function () {
		Meteor.call("leaveGame");
	}
});

Template.form.events({
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
	}
});

Template.game.events({
	"click #drawDeck": function () {
		console.log("calling draw");
		Meteor.call("draw", 1, true);
	},
	"submit #chatForm": function (event, form) {
		event.preventDefault();
		var msg = form.find("#msgText").value;
		form.find("#msgText").value = "";
		if (msg.length > 0) {
			Meteor.call("sendChat", msg);
		}
	},
	"click .card": function (e) {
		var cardId = $(e.currentTarget).attr("cardid");
		var userInfo = UserInfo.find({"username": Meteor.user().username}).fetch()[0];
		var Game = GameList.find(userInfo.gameId).fetch()[0];
		var players = Game.pList;
		var recipient;
		for (var i = 0; i < players.length; i++) {
			if (players[i] == Meteor.user().username) {
				players.splice(i, 1);
			}
		}
		recipient = players[0];
		console.log("Passing in " + cardId);
		Meteor.call("playCard", cardId, recipient);
	}
});