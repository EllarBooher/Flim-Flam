class Combat {
	
	/*
	The combat object for holding all the combat related functions.
	TODO: everything, updateEnemyPanel, player death, more debuff support
	*/
	
	constructor(encounter_ID) {
		this.enemy_instances = {};
		this.enemy_locations = [];
		this.enemy_IDs = [];
		this.enemy_healths = [];
		
		this.battle_progress = 1; //stores if the battle is ongoing to help with termination
		this.enemy_panel = document.querySelector("#enemy_panel");
		
		this.is_rhythmic = true; //stores what phase we're on

		this.player_location = [2,2]; //initializes the player location at 2,2
		
		this.parse_ready = true; //ready to parse a tactical attack

		this.attack_multiplier = 1; //stores the base multiplier of a tactical attack
		this.attack_ID = 0; //stores the ID of an attack
		this.attack_rotation = 0; //stores the relative rotation of an attack (default is 0, unrotated)
		this.attack_flip = false; //stores if an attack is flipped
		this.attack_thicc = 0; //stores the affect an attack has on the thiccness during rhythm mode
		
		this.encounter = ENCOUNTER_DICT[encounter_ID];

		var self = this;
		this.keydown = function(e) {	
			input.value = '';
			if (e.keyCode == 32 /*space*/ && self.is_rhythmic) {
				self.rhythmIncrement();
			}
			else if ([65,83, 68, 70].indexOf(e.keyCode) > -1 /* a, s, d, or f */ && (!(self.is_rhythmic)) && (self.parse_ready)) {
				self.attack_ID = player.stats.bound_attacks[[65,83,68,70].indexOf(e.keyCode)]; //grabs the ID attack of that particular shortcut
				self.attackParse(e.keyCode, self.attack_ID);
			}
			print_out.scrollTop += 1000;
		}
		input.addEventListener('keydown',this.keydown); //Adds the event for the combat to increment on a spacebar press.
		
		this.attackInitialize(); //Starts the actual combat.
	}
	
	attackInitialize () {
		
		/*
		Initializes the combat and gets all the variables in order.
		utilities used: print, copyObject
		*/
		
		this.swapMode(); //Swaps to tactical mode to ensure everything is initialized right

		let temp_text = "Combat has started with the <b>";
		let temp_counter = this.encounter.length; //keeps track of the number of enemy names so we can stick 'and' before the last one

		for (var i in this.encounter) {
			i = parseInt(i);
			this.enemy_instances[i] = cloner.deep.copy(ENEMY_DICT[i]); //Makes a copy of the enemy from the dictionary
			this.enemy_locations = this.enemy_locations.concat(this.startingLocations(this.encounter[i])); //Picks starting locations for the enemies
			for (var j = 0; j < this.encounter[i]; j++) {
				this.enemy_IDs.push(i);
				this.enemy_healths.push(ENEMY_DICT[i].stats.health);
			}; //Stores the enemy (defined by the position in the locations and healths arrays) IDs and their HPs
			if (temp_counter == this.encounter.length) {
				temp_text += this.encounter[i]+" "+ENEMY_DICT[i].plural_name;
			} //first name, no comma needed
			else if (temp_counter == 1) {
				temp_text += ", and "+this.encounter[i]+" "+ENEMY_DICT[i].plural_name;
			} //last name, comma needed
			else {
				temp_text += ", "+this.encounter[i]+" "+ENEMY_DICT[i].plural_name;
			}; //random name, needs a comma
		}; //iterates over each enemy from the encounter

		let initial_enemy_x = (Math.random()*(canvas.width-2*BATTLE_DICT.total_width)/canvas.width)*canvas.width+BATTLE_DICT.total_width;
		this.temp_variables = [player.stats.total_stats.speed, Math.random()*canvas.width, initial_enemy_x, this.attack_thicc]; 
		//Player speed, initial cursor x position, initial enemy x position, enemy_instance. This is gonna be passed in the battle loop.
		
		this.battle = new MyLoop(rhythmPulse, 16, this.temp_variables); //The loop that draws the cursor and enemy. 
		// function, time delay in ms between frames, iterated variable array

		print(temp_text+"</b>.",true);
	
		player.updateStats();
		player.updateCombatStats();
		player.updatePlayerPanel(true); //makes sure the player is all updated
		this.updateEnemyPanel(this.enemy_instances, this.enemy_healths, this.enemy_IDs); //adds the enemy to the drawing panel
		this.drawController(this.enemy_locations, false); //draws without enemies
		
	}
	
	rhythmIncrement () {
		
		/*
		Increments combat a turn. Enemy and player damage eachother, and prints the results to the screen. Also checks collision.
		*/

		this.battle.start += 100; //Adds the stutter to the loop, causing the cursor to pause for a moment to add impact to combat.
		
		var hit; //controls whether or not the player hit
		var rhythm_multiplier = 0; //The multiplier based on how well the player lands the attack
		var attack_obj = ATTACK_DICT[this.attack_ID];
		var attack_thicc = attack_obj.thicc;
		var thicc = attack_thicc; //seems redundant, but future proofing

		var enemy_width = BATTLE_DICT.total_width*thicc; //The total width of the enemy.
		var cursor_width = player.stats.combat_stats.cursor_width;
	
		var cursor_x = this.battle.temp_variables[1]+cursor_width/2; 
		var enemy_x = this.battle.temp_variables[2]+enemy_width/2; //adjusting the x as we do calculations from the center
		
		if (Math.abs(cursor_x - enemy_x) > 0.5*(cursor_width+enemy_width)) {
			hit = 0; 
		} //Checks if the player cursor is too far from the enemy, and sets the weighted distance to 0. Remember, the x is adjusted to be the center		
		else {
			hit = 1;
			var left_weight = 2*(cursor_x - cursor_width/2 - enemy_x)/enemy_width;
			var right_weight = 2*(cursor_x + cursor_width/2 - enemy_x)/enemy_width;

			if (right_weight > 0 && left_weight < 0) {
				rhythm_multiplier = 1.2;
			}
			else if (left_weight > 0) {
				if (left_weight < 1 - BATTLE_DICT.orange) {
					rhythm_multiplier = 1.2;
				}
				else if (left_weight < 1 - BATTLE_DICT.yellow) {
					rhythm_multiplier = 1;
				}
				else if (left_weight < 1) {
					rhythm_multiplier = 0.5;
				}
			}
			else if (right_weight < 0) {
				right_weight = Math.abs(right_weight);
				if (right_weight < 1 - BATTLE_DICT.orange) {
					rhythm_multiplier = 1.2;
				}
				else if (right_weight < 1 - BATTLE_DICT.yellow) {
					rhythm_multiplier = 1;
				}
				else if (right_weight < 1) {
					rhythm_multiplier = 0.5;
				}				
			}
			
		}; //If the player didn't miss, they hit. The weighted distance is a fraction of the enemy's width. Only one side is considered, due to symmetry.
		var temp_enemy = this.enemy_instances[this.pingClosestEnemy(this.enemy_locations, this.player_location)];
		var enemy_damage = temp_enemy.stats.attack - player.stats.combat_stats.defense;
		if (enemy_damage < 0) {enemy_damage = 0}; //calculates the damage the enemy is gonna deal to the player
		player.stats.delta_stats.health -= enemy_damage;
		print("The "+temp_enemy.name+" hits you for "+Number.parseFloat(enemy_damage).toFixed(2)+"."); //enemies always hit first

		var total_multiplier = rhythm_multiplier*this.attack_multiplier //rhythm and attack multiplier
		var player_damage = total_multiplier*player.stats.combat_stats.attack //calculates the damage the player will deal to the enemy
		
		if (player_damage < 0) {player_damage = 0};

		console.log(this.enemy_damage_multipliers);
		for (var i = 0; i < this.enemy_damage_multipliers.length; i++) {
			if (!(this.enemy_damage_multipliers[i] == 0)) {
				var temp_instance = this.enemy_instances[this.enemy_IDs[i]];
				var temp_player_damage = player_damage * this.enemy_damage_multipliers[i];
				var temp_damage_calc = temp_player_damage - temp_instance.stats.defense; 
				if (temp_damage_calc <= 0) {
					print("Your attack didn't scratch "+temp_instance.name+" "+i+1+".");
				}
				else {
					print("You dealt "+temp_damage_calc+" to "+temp_instance.name+" "+i+1+" after a "+total_multiplier*this.enemy_damage_multipliers[i]+" times multiplier.");
					this.enemy_healths[i] -= temp_damage_calc;
				};
			};
		};

		player.updateCombatStats();
		
		player.stats.combat_stats.health = Number.parseFloat(player.stats.combat_stats.health).toFixed(2);
		// this.enemy_instance.stats.health = Number.parseFloat(this.enemy_instance.stats.health).toFixed(2); 
		//rounds the health values to two digits due to floating point errors.
		
		if (player.stats.combat_stats.health <= 0) {
			this.combatEnd();
			console.log("You lost!")
			return;
		}
		/*
		if (this.enemy_instance.stats.health <= 0) {
			this.combatEnd(true);
			return;
		}; //ends combat if the enemy is out of health.
		*/
		this.enemySteps(); //has all the enemies move
		player.updatePlayerPanel(true);
		this.updateEnemyPanel(this.enemy_instances, this.enemy_healths, this.enemy_IDs);
		this.swapMode();		
	}
	
	pingLocations(attack_pattern, attack_center, enemy_locations) {
		/*
		returns an array where each position corresponds with the damage multiplier for that enemy.
		*/
		let n = attack_pattern.length;
		var temp_multipliers = [];
		var temp_tuple;
		for (var i = 0; i < enemy_locations.length; i++) {
			temp_multipliers[i] = 0;
		};//initializes the multiplier as all 0s (aka assumes no enemies are in the zone)
		for (var i = -1; i < -1+n; i++) {
			for (var j = -1; j < -1+n; j++) {
				temp_tuple = [i+attack_center[0],j+attack_center[1]]
				if (isArrayInArray(enemy_locations,temp_tuple)) {
					temp_multipliers[whereArrayInArray(enemy_locations,temp_tuple)] = attack_pattern[i+1][j+1];
				};
			};
		};			
		return temp_multipliers;
	}
	
	pingClosestEnemy(enemy_locations, player_location) {
		/*
		Returns the enemy ID of the closest enemy.
		*/

		var temp_distances = [];
		var a,b,c;

		for (var i = 0; i < enemy_locations.length; i++) {
			a = enemy_locations[i][0] - player_location[0];
			b = enemy_locations[i][1] - player_location[1];
			c = a*a + b*b;
			temp_distances.push(Math.sqrt(c));
		};
		return this.enemy_IDs[temp_distances.indexOf(Math.min(...temp_distances))]; //closest enemy (minimum of the distances, first enemy is prioritized)
	}

	enemySteps() {
		/*
		Makes every enemy move according to their pattern. avoids player
		*/
		var temp_steps;
		var temp_step;
		var temp_tuple;

		for (var i = 0; i < this.enemy_locations.length; i++) {
			temp_steps = this.enemy_instances[this.enemy_IDs[i]].steps;
			console.log(this.enemy_locations)
			temp_step = this.chooseStep(this.enemy_locations[i], temp_steps, this.enemy_locations);
			temp_tuple = addArrays(this.enemy_locations[i], temp_step);
			this.enemy_locations[i] = temp_tuple;
		};
	}
	
	attackParse(key_code, attack_ID) {
		/*
		Parses the player's attack for positioning, and finalizes it.
		*/
		this.parse_ready = false; //stops the player from trying to parse any more attacks.
		this.attack_center = this.player_location.slice(0); //slice so we just copy the location
		this.attack_range = ATTACK_DICT[attack_ID].range; //the max range
		this.temp_pattern = ATTACK_DICT[attack_ID].pattern;
		this.drawController(this.enemy_locations,true,this.temp_pattern,this.attack_center);
		var self = this;
		this.temp_keydown = function(e) {
			input.value = '';
			if ([38,37,40,39].indexOf(e.keyCode) > -1 /*arrow keys*/) {
				self.attack_center = self.moveAttack([38,37,40,39].indexOf(e.keyCode), self.player_location, self.attack_range, self.attack_center); //grabs the attack location info
			}
			else if (e.keyCode == 32 /* space */) {
				self.attackFinalize(self.attack_ID);
			}
			else if (e.keyCode == 82 /* R */) {
				self.temp_pattern = self.rotateLeft(self.temp_pattern);
			}
			else if (e.keyCode == 70 /* F */) {
				print("Good job, you just tried to flip, ya goober. That's too hard for me to program right now.");
			};
			self.drawController(self.enemy_locations,true,self.temp_pattern,self.attack_center);
		};
		print("Arrow keys to point, R to rotate, F to flip, space to complete.");
		input.addEventListener("keydown", this.temp_keydown);
	}
	
	attackFinalize(attack_ID) {
		/*
		Figures out which targets are being hit and passes the torch to rhythm.
		*/
		this.parse_ready = true;
		input.removeEventListener("keydown", this.temp_keydown);

		this.enemy_damage_multipliers = this.pingLocations(this.temp_pattern,this.attack_center,this.enemy_locations);
		console.log("Attack Finalized");
		this.tacticalIncrement(attack_ID);
		
	}
	
	moveAttack(direction, player_location, attack_range, attack_center) {
		/*
		Moves the pattern according to the inputed direction. Called by attackParse, always available.
		For direction, 1 left, 0 up, 3 right, 2 down. (number of rotations).
		*/
		var temp_attack_center = attack_center.slice(0);

		if (temp_attack_center[0] > 0 && direction == 1 && this.checkDistance(player_location, attack_range, [temp_attack_center[0]-=1,temp_attack_center[1]])) {
			attack_center[0] -= 1; //left
		}
		else if (temp_attack_center[1] > 0 && direction == 0 && this.checkDistance(player_location, attack_range, [temp_attack_center[0],temp_attack_center[1]-=1])) {
			attack_center[1] -= 1; //up
		}
		else if (temp_attack_center[0] < bf_canvas.width/50 && direction == 3 && this.checkDistance(player_location, attack_range, [temp_attack_center[0]+=1,temp_attack_center[1]])) {
			attack_center[0] += 1; //right
		}
		else if (temp_attack_center[1] < bf_canvas.height/50 && direction == 2 && this.checkDistance(player_location, attack_range, [temp_attack_center[0],temp_attack_center[1]+=1])) {
			attack_center[1] += 1; //down
		}; //shifts the attack the right direction
		
		return attack_center;
	}
	
	checkDistance(player_location, attack_range, attack_center) {
		/*
		Makes sure moving an attack doesn't put it out of bounds. Uses distance formula.
		*/
		var a = attack_center[0] - player_location[0];
		var b = attack_center[1] - player_location[1];
		var c = attack_range[1];
		return (a*a + b*b <= c*c);
	}

	rotateLeft(matrix) {
		/*
		rotates a 2d array (attack pattern) once to the left.
		*/
		
		var temp_matrix = [[0,0,0],[0,0,0],[0,0,0]];
		let n = temp_matrix.length - 1;
		//rotate once to the left.
		for (var i = 0; i <= n; i++) {
			for (var j = 0; j <= n; j++) {
				temp_matrix[j][n-i] = matrix[i][j];
			};
		};
		
		return temp_matrix				
	}

	drawController(enemy_locations, include_attack = false, temp_pattern, attack_center, include_enemies = true, include_player = true) {
		/*
		Handles drawing all the stuff for the tactical field.
		*/
		this.drawCharacters(include_enemies, include_player);
		this.drawGrid();
		if (include_attack) {
			this.drawAttack(temp_pattern, attack_center);
		};
		this.drawLabels(enemy_locations);
	}
	
	drawCharacters(include_enemies = true, include_player = true) {
		/*
		Draws all the enemies based on how many are visible. Also draws the player.
		*/
		
		//Now, we draw the enemies

		//Clear the canvas
		bf_ctx.clearRect(0,0,bf_canvas.width,bf_canvas.height);
		if (include_enemies) {
			for (var i in this.enemy_locations) {
				let temp_tuple = this.enemy_locations[i];
				rect(temp_tuple[0]*50,temp_tuple[1]*50,50,50,'red',bf_ctx);
			}; 	//Draws a red square for each enemy
		};
		//Now, we draw the player
		
		if (include_player) {
			rect(this.player_location[0]*50,this.player_location[1]*50,50,50,'green',bf_ctx);
		}; //player is a green square
	}

	drawGrid() {
		/*
		Draws the grid for the battlefield. Remember, grid must be offset by half a pixel. Assumes the grid is square.
		*/
		bf_ctx.strokeStyle = "black"; //ensures the lines are black
		for (var i = -.5; i < bf_canvas.width-1; i += 50) {
			bf_ctx.moveTo(i,0);
			bf_ctx.lineTo(i,canvas.width);
			bf_ctx.stroke();
			bf_ctx.moveTo(0,i);
			bf_ctx.lineTo(canvas.width,i);
			bf_ctx.stroke();
		};

	}

	drawAttack(temp_pattern, attack_center) {	

		let n = temp_pattern.length-1;

		//now we draw
		bf_ctx.font = "20px Arial";
		bf_ctx.textAlign = "center";

		for (var i = 0; i <= n; i++) {
			for (var j = 0; j <= n; j++) {
				if (!(temp_pattern[i][j] == 0)) {
					rect((attack_center[0]-1+i)*50+10,(attack_center[1]-1+j)*50+10,30,30,"yellow",bf_ctx);
					bf_ctx.fillStyle = "black";
					bf_ctx.fillText(temp_pattern[i][j],(attack_center[0]-1+i)*50+25,(attack_center[1]-1+j)*50+30);
				};
			};
		};	

	}
	
	drawLabels(enemy_locations) {
		/*
		Draws the labels for the enemies so the player can identify them.
		*/
		
		for (var i = 0; i < enemy_locations.length; i++) {
			bf_ctx.fillStyle = "black";
			bf_ctx.font = "15px Arial";
			bf_ctx.fillText(i+1,enemy_locations[i][0]*50+5,enemy_locations[i][1]*50+15);			
		};
		
	}
	
	startingLocations(count) {		
		/*
		Chooses the initial starting points for each enemies. Stores them in tuples, avoids previously decided locations.
		*/
		var temp_locations = [];
		for (i = 1; i <= count; i++) {
			temp_locations.push(this.chooseTuple(temp_locations));
		};
		return temp_locations;		
	}
	
	chooseTuple(avoid_locations = [], avoid_player = true) {		
		/* 
		Chooses a tuple location and recursively makes it avoid the player or the desired avoided locations. For now, the gameboard is hardcoded 5 by 5.
		*/		
		var temp_tuple = [Math.floor(Math.random()*bf_canvas.width/50),Math.floor(Math.random()*bf_canvas.height/50)];		
		if (JSON.stringify(temp_tuple) === JSON.stringify(this.player_location) || isArrayInArray(avoid_locations,temp_tuple)) {
			temp_tuple = this.chooseTuple(avoid_locations, avoid_player);
		};		
		return temp_tuple;
		
	}

	chooseStep(enemy_location, potential_steps, avoid_locations = [], avoid_player = true, avoid_boundaries = true) {
		/*
		Same as choose tuple except with position detection.
		*/
		var temp_tuple = potential_steps[Math.floor(Math.random()*potential_steps.length)];
		var temp_tuple2 = addArrays(enemy_location, temp_tuple);

		if (JSON.stringify(temp_tuple2) === JSON.stringify(this.player_location) || isArrayInArray(avoid_locations,temp_tuple2) || temp_tuple2[0] < 0 || temp_tuple2[1] < 0 || temp_tuple2[0] >= bf_canvas.width/50 || temp_tuple2[1] >= bf_canvas.height/50) {
			temp_tuple = this.chooseStep(enemy_location, potential_steps, avoid_locations, avoid_player);
		};	
		return temp_tuple;
	}
	
	tacticalIncrement(attack_ID) {
		
		/*
		Increments the tactical aspect of gameplay.
		*/
		var temp_attack = ATTACK_DICT[attack_ID];
		print("You prep "+temp_attack.name+". It multiplies your damage by "+temp_attack.damage+" times.");
		this.attack_multiplier = temp_attack.damage;
		this.attack_thicc = temp_attack.thicc;
		this.swapMode();
		
	}
	
	swapMode() {
		
		/*
		Swaps the gurrent gameplay mode that is occuring. If it is currently tactical, switches to rhythmical, and vice versa.
		*/
		this.drawController(this.enemy_locations);

		if (this.is_rhythmic) {
			//Swap to tactical
			this.is_rhythmic = false;
			console.log("Swapping to tactical!");
			print("You are currently in tactical mode. Press <b>'a'</b> for "+ATTACK_DICT[player.stats.bound_attacks[0]].name+
			" <b>'s'</b> for "+ATTACK_DICT[player.stats.bound_attacks[1]].name+
			" <b>'d'</b> for "+ATTACK_DICT[player.stats.bound_attacks[2]].name+
			" or <b>'f'</b> for "+ATTACK_DICT[player.stats.bound_attacks[3]].name+".",true);
			canvas.style.display = "none";
		}
		else {
			//Swap to rhythmic
			this.is_rhythmic = true;
			this.battle.temp_variables[1] = 0; //shoves the cursor to the left
			//this.battle.temp_variables[2] = (Math.random()*(canvas.width-2*BATTLE_DICT.total_width*this.enemy_instance.thicc)/canvas.width)*canvas.width;
			this.battle.temp_variables[2] = (Math.random()*(canvas.width-BATTLE_DICT.total_width*this.attack_thicc));
			this.battle.temp_variables[3] = this.attack_thicc;
			//gives the enemy a random position too
			console.log("Swapping to rhythmic!");
			print("You are currently in rhythmic mode. Press space to attack.");
			canvas.style.display = "block";
		};
		
	}
	
	combatEnd(success = false) {
		
		/*
		Ends combat, lots of loose ends to clear up. Handles loot, experience, and kill counts.
		*/
		
		//Stuff that happens on a win
		if (success) {			
			print("The "+this.enemy_instance.name+" crumples to the ground. You are victorious!");
		
			KILL_COUNT[this.enemy_instance.ID] += 1; //Adds one to the kill count
			room.enemies[this.enemy_instance.ID] -= 1; //Removes an enemy from the current room
		
			if (room.enemies[this.enemy_instance.ID] <= 0) {
				print("You have killed the last "+this.enemy_instance.name+"... None remain.");
				room.enemies[this.enemy_instance.ID] = 0;
				room.enemy_IDs.splice(room.enemy_IDs.indexOf[this.enemy_instance.ID]); //removes the enemy_ID from the list of enemy_IDs in the room
				delete room.enemies[this.enemy_instance.ID]; //removes the ID of the enemy from the list of enemy counts in the room
			} // House cleaning if all the enemies were killed in a room.	
			else if (room.enemies[this.enemy_instance.ID] > 1){
				print("Although you have vanquished one, "+room.enemies[this.enemy_instance.ID]+" "+this.enemy_instance.plural_name+" remain!");
			}
			else {
				print("You've killed another, and a single "+this.enemy_instance.name+" lingers.");
			} //Updates the player on the number of enemies left.
		
			player.updateLevel(this.enemy_instance.experience);		
			player.giveItem(lootDrop(this.enemy_instance.drops)); //drops an item
		}
		else {
			print("Your health dwindles to zero and you are defeated by the enemy...");
		};

		//Things that always happen, despite failing or not:
		this.battle_progress = 0; //Battle is no longer in progress	
		input.value = '';		
		this.battle.stop(); //stops the battle loop
		window.requestAnimationFrame(clearCanvas); //clears the lingering frame
		input.removeEventListener('keydown',this.keydown); //removes the attack increment on space
		
		canvas.style.display = "none";
		player.updateStats();
		player.flushDebuffs();
		player.updatePlayerPanel();
		this.enemy_instance = {}; //clears the enemy_instance
		this.updateEnemyPanel(true);
		
	}
	
	updateEnemyPanel(enemy_instances, enemy_healths, enemy_IDs, clear_panel = false) {
		
		/*
		Prints the enemy stats in the enemy_panel html object (middle right of the screen).
		Utilities used: capitalizeFirstLetter(). This returns a string with the first letter capitalized.
		*/
		var temp_text = '';
		
		if (!(clear_panel)) {
			for (var i in enemy_instances) {
				temp_text += '<b><u>'+enemy_instances[i].proper_name+'</u></b> \n'+enemy_instances[i].description+'\n <b><u> Healths: </u></b>\n';
				for (var j = 0; j < enemy_healths.length; j++) {
					if (enemy_IDs[j] == i) {
						temp_text += j+1+') '+enemy_healths[j]+'\n';
					};
				};
				temp_text += '<b><u> Stats: </u></b> \n'
				for (var j in enemy_instances[i].stats) {
					if (!(j == 'health')) {
						temp_text += capitalizeFirstLetter(j)+': '+enemy_instances[i].stats[j]+'\n';
					};
				}; //Adds the text
			};

		};
		
		this.enemy_panel.innerHTML = temp_text;
		
	}
};