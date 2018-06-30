const ATTACK_DICT = {
	1: {
		'name': "single strike",
		'damage': 1,
		'range': [0,5],
		'pattern': [[0,0,0],[0,1.5,0],[0,0,0]],
		'movement_multiplier': 1.5,
		'choose_direction': true,
		'thicc': 1
	},
	2: {
		'name': "wide strike",
		'damage': 1.5,
		'range': [0,1],
		'pattern': [[0,0,0],[1,1.2,1],[0,0,0]],
		'movement_multiplier': .2,
		'choose_direction': true,
		'thicc': 1.2
	},
	3: {
		'name': "two-prong strike",
		'damage': 1,
		'range': [0,1],
		'pattern': [[0,0,0],[1.2,.6,1.2],[0,0,0]],
		'movement_multiplier': .8,
		'choose_direction': false,
		'thicc': .6
	},
	4: {
		'name': "area strike",
		'damage': 1,
		'range': [3,4],
		'pattern': [[.6,1,.6],[1,1.2,1],[.6,1,.6]],
		'movement_multiplier': .5,
		'choose_direction': false,
		'thicc': 1.4
	}
}