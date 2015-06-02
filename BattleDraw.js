/* global UserInfo */
/* global GameList */
/* global CardList */
/* global Meteor */
/* global Accounts */
/* global Template */
/* global Mongo */
/* global $ */


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
	
	var scroll = function () {
		var element = document.getElementById("msgList");
		element.scrollTop = element.scrollHeight;
	};
	
	setInterval(function () {
		if (Meteor.user()) {
			scroll();
			
			var userInfo = UserInfo.find({ "username": Meteor.user().username }).fetch();
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
		if ($("#yourCardTable").width() > 800) {
			$("#yourCards").css("overflow-x", "scroll");
		}
		else {
			$("#yourCards").css("overflow-x", "hidden");
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
				else if (game.countDown == 0 && game.round < 1) {
					Meteor.call("startGame");
				}
				else if (game.round == 1 && UserInfo.find({"username": Meteor.user().username}).fetch()[0].stats.cards.length < 5) {
					Meteor.call("draw", 5, false);
				}
			}
		}
	}, 1000);
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		var cards = [
			{ "_id": "0", "name": "Buy Units", "desc": "Buys the specified number of units. $10 per unit", "class": "buy", "rarity": 1 },
			{ "_id": "1", "name": "Buy Supplies", "desc": "Buys the specified number of supplies. $2 per supply", "class": "buy", "rarity": 1 },
			{ "_id": "2", "name": "Basic Attack", "desc": "Attacks with 20% of units. Chance of capturing 0 to 3 territories", "class": "attack", "rarity": 1 },
			{ "_id": "3", "name": "Basic Raid", "desc": "Raids with 20% of units. Chance of stealing 0% to 15% of supplies and 0% to 5% of money", "class": "raid", "rarity": 1 },
			{ "_id": "4", "name": "Draw 2", "desc": "Draw two cards. Drawing the cards does not count as extra actions", "class": "draw", "rarity": 2 },
			{ "_id": "5", "name": "Small Bomb", "desc": "Bombs the opponent's units. Chance of killing 0% to 10% of units, costs 100 supplies and $100", "class": "bomb", "rarity": 2 },
			{ "_id": "6", "name": "Intermediate Attack", "desc": "Attacks with 50% of units. Chance of capturing 1 to 6 territories", "class": "attack", "rarity": 2 },
			{ "_id": "7", "name": "Intermediate Raid", "desc": "Raids with 50% of units. Chance of stealing 10% to 50% of supplies and 5% to 10% of money", "class": "raid", "rarity": 2 },
			{ "_id": "8", "name": "Draw 3", "desc": "Draw three cards. Drawing the cards does not count as extra actions", "class": "draw", "rarity": 3 },
			{ "_id": "9", "name": "Medium Bomb", "desc": "Bombs the opponent's units. Chance of killing 5% to 30% of units, costs 250 supplies and $250", "class": "bomb", "rarity": 3 },
			{ "_id": "10", "name": "Advanced Attack", "desc": "Attacks with 90% of units. Chance of capturing 3 to 8 territories", "class": "attack", "rarity": 3 },
			{ "_id": "11", "name": "Advanced Raid", "desc": "Raids with 90% of units. Chance of stealing 50% to 90% of supplies and 7% to 15% of money", "class": "raid", "rarity": 3 },
			{ "_id": "12", "name": "Basic Assassinate", "desc": "Kills enemy units with 5% of your units. Chance of killing 10% to 15% of enemy units", "class": "assassinate", "rarity": 3 },
			{ "_id": "13", "name": "Draw 4", "desc": "Draw four cards. Drawing the cards does not count as extra actions", "class": "draw", "rarity": 4 },
			{ "_id": "14", "name": "Large Bomb", "desc": "Bombs the opponent's units. Chance of killing 20% to 50% of units, costs 500 supplies and $500", "class": "bomb", "rarity": 4 },
			{ "_id": "15", "name": "Stealth Raid", "desc": "Raids with 20% of units. Chance of stealing 60% to 80% of supplies and 15% to 20% of money", "class": "raid", "rarity": 4 },
			{ "_id": "16", "name": "Intermediate Assassinate", "desc": "Kills enemy units with 10% of your units. Chance of killing 20% to 30% of enemy units", "class": "assassinate", "rarity": 4 },
			{ "_id": "17", "name": "Draw 5", "desc": "Draw four cards. Drawing the cards does not count as extra actions", "class": "draw", "rarity": 5 },
			{ "_id": "18", "name": "Nuke", "desc": "Bombs the opponent's units. Chance of killing 70% to 90% of units, costs 1000 supplies and $1000", "class": "bomb", "rarity": 5 },
			{ "_id": "19", "name": "Advanced Assassinate", "desc": "Kills enemy units with 20% of your units. Chance of killing 40% to 50% of enemy units", "class": "Assassinate", "rarity": 5 }
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
			return UserInfo.find();
		}
	});
	
	Meteor.publish("cards", function () {
		return CardList.find();
	});
}