/* global UserInfo */
/* global GameList */
/* global CardList */
/* global Meteor */
/* global Accounts */
/* global Template */
/* global Mongo */

GameList = new Mongo.Collection("games");
UserInfo = new Mongo.Collection("userInfo");
CardList = new Mongo.Collection("cards");

if (Meteor.isClient) {
	Meteor.subscribe("games");
	Meteor.subscribe("userinfo");
	Meteor.subscribe("cards");

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});

	setInterval(function () {
		if (Meteor.user()) {
			var userInfo = UserInfo.find().fetch();
			if (!userInfo[0]) {
				Meteor.call("addUser");
			}
			
			var userInfoFetch = UserInfo.find({"username": Meteor.user().username}).fetch()[0];
			if (userInfoFetch.inGame) {
				var game = GameList.find(userInfoFetch.gameId).fetch()[0];
				
				if (game.numPlayers == game.maxPlayers && game.host == Meteor.user().username && !game.hasStarted) {
					Meteor.call("beginCount", game._id);
				}
				Meteor.call("updateCountDown", game._id);
			}
		}
	}, 100);
	
	setInterval(function() {
		if (Meteor.user()) {
			var userInfoFetch = UserInfo.find({"username": Meteor.user().username}).fetch()[0];
			if (userInfoFetch.inGame) {
				var game = GameList.find(userInfoFetch.gameId).fetch()[0];
				if (game.countDown > 0) {
					Meteor.call("updateCountDown");
				}
				else if (game.countDown == 0) {
					Meteor.call("startGame");
				}
			}
		}
	}, 1000);
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		var cards = [
			{ "_id": "0", "name": "Basic Attack", "desc": "", "class": "attack", "rarity": 1 },
			{ "_id": "1", "name": "Buy Units", "desc": "", "class": "buy", "rarity": 1 },
			{ "_id": "2", "name": "Buy Supplies", "desc": "", "class": "buy", "rarity": 1 },
		];
		for (var i = 0; i < cards.length; i++) {
			if (CardList.find(cards[i]._id).fetch().length == 0) {
				CardList.insert(cards[i]);
			}
		}
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
	
	Meteor.publish("cards", function () {
		return CardList.find();
	});
}