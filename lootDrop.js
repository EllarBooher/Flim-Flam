function cumulativeRoll (chance_list) 
{
	
	/*
	Given a list that is a sorted list of cumulative chances, returns the index of the chosen roll. Returns -1 for the null roll. 
	It does this by subtracting a random roll from the list and choosing the first positive value (thus the first threshhold our roll didn't pass).
	*/
	let roll = Math.random();

	let temp_list = chance_list.map( function(value) {
		return value - roll
	});
	for (i in temp_list) {
		if (temp_list[i] >= 0) {
			return parseInt(i);
		}
	}
	
	return -1
	
}

function lootDrop (drops) 
{

	/*
	Selects a drop when given the drops object of an enemy instance. Default drop is 0, which is ignored later.
	First it decides which category (staff, armor, ring, or unique) should be chosen using cumulativeRoll.
	Then it does another cumulativeRoll for uniques, or gives the player the tier specified by the drops object with a 70% chance to downgrade to a lower tier.
	*/

	let drop = 0;
	let category = cumulativeRoll(drops.drop_chances); //0 if armor, 1 if staff, 2 if ring, 3 if unique, -1 if the player gets dada
	
	if (category == 3) {
		drop = drops.uniques[cumulativeRoll(drops.unique_chances)]; //Drops a unique
	}
	else if (category == -1) {
		drop = 0;
	}
	else if (category <= 2) {
		let max_tier = drops.drop_tiers[category]; //Sets the max tier
		max_tier = downgradeTier(max_tier,.60) //Repeatadly downgrades the maximum tier with a 60% chance to downgrade.
		drop = max_tier+(category)*1000; //Makes drop the item, categories are modulo 1000 (check ITEM_DICT)
	};
	
	return drop
}

function downgradeTier(tier,chance)
{
	/*
	Recursively downgrades the tier of the item with a chance% chance to downgrade by 1.
	*/
	
	var temp_tier = tier;
	var temp_roll = Math.random();
	
	if (temp_roll < chance && temp_tier > 1) {
		temp_tier -= 1;
		temp_tier = downgradeTier(temp_tier,chance);
	};
	
	return temp_tier;
	
}