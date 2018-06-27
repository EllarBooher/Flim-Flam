class Player 
{
		
	/*
	The player object. It is global so its state can always be referenced.
	TODO: make updatelevel update the stats too, updatePlayerPanel draws items
	*/
	
	constructor() {
		
		/*
		Initializes all the variables for the player. No items, base stats. Also draws the player for the first time.
		*/
		
		this.inventory = {
			'armor': [],
			'staff': [],
			'ring': [],
			'potion': []			
		};
		
		this.stats = {
			'level': 1,
			'experience': 0,
			
			'combat_stats': {
				'health': 10,
				'attack': 1,
				'defense': 1,
				'cursor_width': 5,
				'speed': 2
			}, //Stats after delta_stats, for use in combat.
			
			'delta_stats': {
				'health': 0,
				'attack': 0,
				'defense': 0,
				'cursor_width': 0,
				'speed': 0
			}, //Stores the changes in stats during combat. Most likely negative, indicating a debuff/damage.
			
			'total_stats': {
				'health': 10,
				'attack': 1,
				'defense': 1,
				'cursor_width': 5,
				'speed': 2
			}, //Total effective stats
			
			'base_stats': {
				'health': 10,
				'attack': 2,
				'defense': 1,
				'cursor_width': 5,
				'speed': 2
			}, //Stats innate to the player (before equipment/buffs)
			
			'equipment_stats': {
				'health': 0,
				'attack': 0,
				'defense': 0,
				'cursor_width': 0,
				'speed': 0
			}, //Stats gained from equipment
		
			'equipped': {
				'armor': 0,
				'ring': 0,
				'staff': 0
			}, //Current items equipped (UIDs)
			
			'bound_attacks': [1,2,3,4]
		};
		
		this.player_panel = document.querySelector('#player_panel');
		
		this.updateStats();
		this.updatePlayerPanel();
		
	}	
	
	updateStats() {
		
		/*
		Iterates over the items the players has and totals up the stats for display and updating of the players stats. 
		Meant to be modular and easily adaptable to arbitrary stats that the items may possess.
		See updateCombatStats.
		Utilities used: calculateItemBuffs. this returns the adjusted item.stats object (with the UID as the name)
		*/
		
		let temp_stats = {}; //The container for the stats objects before we add them up
		let temp_total = {}; //The totaled stats
		let temp_UIDs = []; //Holding the temporary UIDs for each item
		var i, j
		
		for (i in this.stats.equipped) {
			if (!(this.stats.equipped[i] == 0)) {
				temp_UIDs.push(this.stats.equipped[i]);
			};
		}; //Grabs the UIDs

		for (i in temp_UIDs) {
			temp_stats[temp_UIDs[i]] = ITEM_DICT[ITEMS[temp_UIDs[i]].ID].stats;
			//copies each stats from the item dictionary to the temporary stats object
		}; 
		console.log(temp_stats)
		for (i in temp_stats) {
			for (j in temp_stats[i]) {
				if (!(j in temp_total)) {
					temp_total[j] = 0;
				};
				temp_total[j] += temp_stats[i][j];
			};
		}; //Goes through each item and either initializes it in temp_total or simply adds its amount
		
		for (i in this.stats.equipment_stats) {
			if (i in temp_total) {
				this.stats.equipment_stats[i] = temp_total[i];	
			}
			else {
				this.stats.equipment_stats[i] = 0;
			};
		}; //Changes the players equipment stats to our new totals. If the stat isn't in the equipment, sets that particular stat to 0.
		
		for (i in this.stats.total_stats) {
			this.stats.total_stats[i] = this.stats.base_stats[i] + this.stats.equipment_stats[i];
		}; //Combines the equipment stats and base stats.
		
	}
	
	flushDebuffs() {
		
		/*
		Clears out the temporary combat stats.
		*/
		
		var i 
		
		for (i in this.stats.delta_stats) {
			this.stats.delta_stats[i] = 0;
		};

	}
	
	updateCombatStats() {
		
		/*
		Updates the total stats to reflect the combat changes and puts it into the combat_stats object, which is referenced by the combat class.
		*/
		
		var i
		
		for (i in this.stats.total_stats) {
			this.stats.combat_stats[i] = this.stats.total_stats[i] + this.stats.delta_stats[i];
		}; //Applies the combat_stats
		
	}
	
	updatePlayerPanel(in_combat = false) {
		
		/*
		Prints the players stats in the player_panel html object (top right of the screen).
		Utilities used: capitalizeFirstLetter(). This returns a string with the first letter capitalized.
		*/

		var i
		
		let temp_text = 
		`<b><u>Player</u></b>
		Level: `+this.stats.level+ `
		Experience: `+this.currentExperience()+` <font color="gray">(`+this.remainingExperience()+` remaining)</font>`;
		if (in_combat) {
			for (i in this.stats.combat_stats) {
				if (!(ALLOWED_STATS.indexOf(i) == -1)) {
					temp_text += `
					`+capitalizeFirstLetter(i)+`: `+this.stats.combat_stats[i];
					if (this.stats.delta_stats[i] == 0) {
						temp_text += ` <font color="gray">(` + this.stats.delta_stats[i] +`)</font>`;
					}//debuff neutral
					else if (this.stats.delta_stats[i] < 0) {
						temp_text += ` <font color="red">(` + this.stats.delta_stats[i] +`)</font>`;
					}//debuff bad
					else if (this.stats.delta_stats[i] > 0) {
						temp_text += ` <font color="green">(` + this.stats.delta_stats[i] + `)</font>`;
					};//buff good
					temp_text += ` <font color="gray">(`+ this.stats.base_stats[i] +`)</font> <font color="green">(+`+this.stats.equipment_stats[i]+`)</font>`
				};
			}; //While in combat, add info about delta stats.
		}
		else {
			for (i in this.stats.total_stats) {
				if (ALLOWED_STATS.indexOf(i) != -1) {
					temp_text += `
					`+capitalizeFirstLetter(i)+`: `+
					this.stats.total_stats[i]+` <font color="gray">(`+
					this.stats.base_stats[i]+`)</font> <font color="green">(+`+
					this.stats.equipment_stats[i]+`)</font>`
				};
			}; //While not in combat, chill out
		};
		temp_text += '\n \n';
		this.player_panel.innerHTML = temp_text;
		
	}
	
	currentExperience() {
		
		/*
		Returns the amount of exp the player currently has (how much they've earned since the previous level up)
		*/
		
		let n = this.stats.level;
		let temp = this.stats.experience - (n*(n-3) + 4);
		
		if (temp < 0) {
			return this.stats.experience
		}
		else if (temp >= 0) {
			return temp
		};
		
	}
	
	remainingExperience() {
		
		/*
		Calculates the opposite of currentExperience, how much exp the player has remaining.
		*/
		
		let n = this.stats.level;
		let temp = (n*(n-1) + 2) - this.stats.experience;

		return temp

	}
	
	updateLevel(exp = 0) {
		
		/*
		Updates the players level. Also gives experience. Updates the base stats to reflect this. The formula is entirely contained in this function.
		n^2 + n + 20 where n is the next level. so (n-1)^2 + (n-1) + 20 = n^2 - 2n +1 + n - 1 + 20 = n^2 - n + 20.
		Also prints a congratulatory message.
		Uses utilities: print
		*/
		
		let n = this.stats.level;

		this.stats.experience += exp;
		if (exp > 0) {
			print("You earned "+exp+" experience.");
		};
		
		if (this.remainingExperience() <= 0) {
			this.stats.level += 1;
			print('Level up! You are now level '+this.stats.level+'.');
			this.updateLevel();
		};
		
		this.updateStats();
		this.updatePlayerPanel();
		
	}
	
	viewInventory() {
		
		/*
		Prints the current inventory that the player posseses.
		Uses utilities: print, capitalizeFirstLetter
		*/
		
		var i, j;
		var text = "";
		
		for (i in this.inventory) {
			let q = 1 //The marker that describes an item
			text += "<b><u>"+capitalizeFirstLetter(i)+"</u></b>: \n"; //Item category header
			for (j in this.inventory[i]) {
				text += q+") "+ITEMS[this.inventory[i][j]].name+" (UID:"+this.inventory[i][j]+") \n"; //J is the UID
				q += 1;
			};
			if (this.inventory[i].length == 0) {
				text += "Nothing \n"
			}
			if (!(i == "potion")) { 
				text += "\n"; //For space and cleanliness
			}
		};
		
		print(text,true);
		
	}
	
	inspectItem(category, index) {
		/*
		Similar to equip, except it spits out information on the item.
		See equip for the edge cases and functionality.
		*/
		
		if (this.inventory[category].length < index) {
			print("You don't have that.");
			return
		};
		
		var text = "";
		let item = ITEM_DICT[ITEMS[this.inventory[category][index-1]].ID];
		
		text += "<b><u>"+item.proper_name+"</u></b> \n"; //Item name header
		text += item.description; //Item description
		
		for (i in item.stats) {
			text += capitalizeFirstLetter(i) + ": "+ item.stats[i]; //Lists the stats
		};

		print(text,true);
		
	}
	
	equip(category, index) {
		
		/*
		Equips an item by swapping the proper inventory item with the equipped item UID. 
		If the currently equipped item is UID 0, then the player simply equips the item.
		Returns if out of bounds (picked an invalid item).
		Should also sort the inventory category.
		Uses utilities: print
		Index refers to the index in the inventory
		*/

		if (this.inventory[category].length < index) {
			print("You don't have that.");
			return
		};
		
		var temp_item = this.stats.equipped[category];
		var temp_new_item = this.inventory[category][index-1];
		var text = "";
		
		this.stats.equipped[category] = temp_new_item; //equips the item
		this.inventory[category].splice(index-1,1); //deletes the item from the inventory
		text += "You equipped the "+ITEMS[temp_new_item].name;
		
		if (!(temp_item == 0)) {
			this.inventory[category].push(temp_item); //returns the previously equipped item to the inventory
			text += ", putting the "+ITEMS[temp_item].name+" back into your inventory.";
		}
		else {
			text += ".";
		}; //If the previous item was 0 (null), then end the sentenc. Else, add something nice.
		
		this.inventory[category].sort(function(a,b) { return (a-b) }) //sorts the inventory category
		print(text);
		
		this.updateStats();
		this.updatePlayerPanel();
			
	}
	
	giveItem(item_ID) {
		
		/*
		Creates an item and puts it in the player's inventory. If the item_ID is 0, return.
		*/
		
		if (item_ID == 0) {
			return
		}; 
		
		let UID = createItem(item_ID);
		
		player.inventory[ITEM_DICT[item_ID].category].push(UID);
		print("You have earned a "+ITEMS[UID].name+".");
		
	}
	
};