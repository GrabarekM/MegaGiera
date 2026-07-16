import starvedWildDog from './enemies/starvedWildDog.js'
import greyWolf from './enemies/greyWolf.js'
import desperatePeasant from './enemies/desperatePeasant.js'
import giantRat from './enemies/giantRat.js'
import mongbat from './enemies/mongbat.js'

export const ENEMY_TEMPLATE_LIST = Object.freeze([starvedWildDog, greyWolf, desperatePeasant, giantRat, mongbat])
export const ENEMY_TEMPLATES = Object.freeze(Object.fromEntries(ENEMY_TEMPLATE_LIST.map((template) => [template.id, template])))
export const WOLF_TEMPLATE = greyWolf
