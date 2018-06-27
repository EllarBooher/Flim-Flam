const ENEMY_DICT = {
	1: {
		'ID': 1,
		'name': 'ball simulacrum',
		'proper_name': 'Ball Simulacrum',
		'plural_name': 'Ball Simulacrums',
		'description': 'An immaculate sphere with surprising spunk.',
		'stats': {
			'attack': 2,
			'defense': 1,
			'health': 10,
		},
		'steps': [[-1,0],[1,0],[0,1],[0,-1]],
		'drops': {
			'drop_chances': [.25,.50,.75,.80], //Armor, Staff, Ring, Unique (cumulative chance)
			'drop_tiers': [1,1,1], //Maximum tier of (armor, staff, ring) respectively that the enemy can drop (modulo 1000)
			'unique_chances': [.95,1], //Chances of uniques (cumulative)
			'uniques': [3002,3003], //Actual unique IDs
		},
		'experience': 2,
		'encounter_size': 3,
		'step_size': 1,
		'thicc': 1
	},
	2: {
		'ID': 2,
		'name': "ball amalgam",
		'proper_name': "Ball Amalgam",
		'plural_name': "Ball Amalgams",
		'description': "The simulacrums have noticed your transgressions against them... Still pathetic.",
		'stats': {
			'attack': 3,
			'defense': 2,
			'health': 30,
		},
		'drops': {
			'drop_chances': [.25,.50,.75,.90], 
			'drop_tiers': [2, 2, 2], 
			'unique_chances': [1],
			'uniques': [3003], 
		},
		'experience': 30,
		'encounter_size': 1,
		'step_size': 2,
		'thicc': 1.5
	}
		
}