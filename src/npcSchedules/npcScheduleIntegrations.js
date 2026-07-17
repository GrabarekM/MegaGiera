import { NPC_ACTIVITY, NPC_AVAILABILITY, NPC_PRESENCE } from './npcScheduleConstants.js'
import { minuteOfDay, timeRangeContains } from './npcScheduleModels.js'

const DISPLAY_NAMES = Object.freeze({
  general_merchant: 'General Merchant', blacksmith: 'Blacksmith', hunter: 'Hunter',
  innkeeper: 'Innkeeper', scholar: 'Scholar', developer: 'Developer',
})
const ACTIVITY_LABELS = Object.freeze({
  [NPC_ACTIVITY.SLEEPING]: 'Sleeping', [NPC_ACTIVITY.WORKING]: 'Working',
  [NPC_ACTIVITY.TRADING]: 'Trading', [NPC_ACTIVITY.TRAINING]: 'Training',
  [NPC_ACTIVITY.TEACHING]: 'Teaching', [NPC_ACTIVITY.STUDYING]: 'Studying',
  [NPC_ACTIVITY.HUNTING]: 'Hunting', [NPC_ACTIVITY.TRAVELLING]: 'Travelling',
  [NPC_ACTIVITY.HIDING]: 'Hiding', [NPC_ACTIVITY.GUARDING]: 'Guarding',
  [NPC_ACTIVITY.SOCIALIZING]: 'Socializing', [NPC_ACTIVITY.EATING]: 'Eating',
  [NPC_ACTIVITY.RESTING]: 'Resting', [NPC_ACTIVITY.IDLE]: 'Idle',
})
const pad = value => String(value).padStart(2, '0')
const formatMinute = minute => `${pad(Math.floor(minute / 60) % 24)}:${pad(minute % 60)}`
const visiblePresence = state => state?.presenceState === NPC_PRESENCE.PRESENT && state.availabilityState !== NPC_AVAILABILITY.HIDDEN

export class NpcLocationPresenceIndex {
  constructor() { this.byLocation = new Map(); this.locationByNpc = new Map() }
  clear() { this.byLocation.clear(); this.locationByNpc.clear() }
  remove(npcId) { const old = this.locationByNpc.get(npcId); if (!old) return; this.byLocation.get(old)?.delete(npcId); if (!this.byLocation.get(old)?.size) this.byLocation.delete(old); this.locationByNpc.delete(npcId) }
  update(npcId, state) { this.remove(npcId); if (!state?.currentLocationId || !visiblePresence(state)) return; const bucket = this.byLocation.get(state.currentLocationId) ?? new Set(); bucket.add(npcId); this.byLocation.set(state.currentLocationId, bucket); this.locationByNpc.set(npcId, state.currentLocationId) }
  rebuild(states) { this.clear(); for (const [npcId, state] of Object.entries(states ?? {})) this.update(npcId, state); return this }
  at(locationId) { return [...(this.byLocation.get(locationId) ?? [])] }
}

export class NpcPresenceService {
  constructor(repository, index = new NpcLocationPresenceIndex()) { this.repository = repository; this.index = index }
  rebuild() { this.index.rebuild(this.repository.runtime.states); return this.index }
  transition(npcId) { this.index.update(npcId, this.repository.state(npcId)) }
  isPresent(npcId, locationId) { return this.index.locationByNpc.get(npcId) === locationId }
}

export class NpcSchedulePresentationResolver {
  activity(state) { return ACTIVITY_LABELS[state?.activityState?.activityType] ?? 'Unavailable' }
  unavailable(state, service = 'Service') {
    if (!state || state.presenceState === NPC_PRESENCE.DISABLED) return `${service} is disabled.`
    if (state.presenceState === NPC_PRESENCE.HIDDEN) return `${service} is currently unavailable.`
    if (state.presenceState === NPC_PRESENCE.TRAVELLING) return `${service} is unavailable while the NPC is travelling.`
    if (state.presenceState !== NPC_PRESENCE.PRESENT) return 'The NPC is not here.'
    if (state.availabilityState === NPC_AVAILABILITY.SLEEPING) return 'The NPC is sleeping.'
    if (state.availabilityState === NPC_AVAILABILITY.BUSY) return 'The NPC is busy.'
    return `${service} is unavailable at this time.`
  }
}

export class NpcServiceHoursResolver {
  constructor(database, repository) { this.database = database; this.repository = repository }
  intervals(npcId, serviceType) {
    const state = this.repository.state(npcId)
    const schedule = this.database.get(state.activeScheduleId) ?? this.database.forNpc(npcId).sort((a,b) => b.priority-a.priority)[0]
    const intervals = (schedule?.entries ?? []).filter(e => e.enabled && e.interactionOverrides?.[serviceType] === true).map(e => ({ start: e.timeRange.startMinuteOfDay, end: e.timeRange.endMinuteOfDay, locationId: this.#location(npcId, e.target) }))
    return intervals.sort((a,b)=>a.start-b.start).reduce((all, current) => { const previous=all.at(-1); if(previous && previous.end===current.start && previous.locationId===current.locationId) previous.end=current.end; else all.push({...current}); return all }, [])
  }
  #location(npcId,target={}) { const a=this.repository.state(npcId); if(target.type==='CurrentLocation')return a.currentLocationId; return target.id ?? null }
  findNextAvailability(npcId, serviceType, worldTime, horizonDays=7) {
    const now=minuteOfDay(worldTime), intervals=this.intervals(npcId, serviceType)
    for(let dayOffset=0;dayOffset<=horizonDays;dayOffset++) for(const interval of intervals){ if(dayOffset===0 && timeRangeContains({startMinuteOfDay:interval.start,endMinuteOfDay:interval.end,crossesMidnight:interval.end<interval.start},worldTime)) return {known:true,availableNow:true,dayOffset:0,minute:now,label:'Now'}; if(dayOffset>0 || interval.start>now) return {known:true,availableNow:false,dayOffset,minute:interval.start,label:`${dayOffset===0?'Today':dayOffset===1?'Tomorrow':`In ${dayOffset} days`} at ${formatMinute(interval.start)}`} }
    return {known:false,availableNow:false,label:'Availability may change.'}
  }
  view(npcId, serviceType, worldTime) { const intervals=this.intervals(npcId,serviceType); return {intervals,display:intervals.map(i=>`${formatMinute(i.start)}–${formatMinute(i.end)}`).join(', ')||'No public hours',next:this.findNextAvailability(npcId,serviceType,worldTime)} }
}

export class NpcServiceAvailabilityResolver {
  constructor({ repository, database, hours = new NpcServiceHoursResolver(database, repository), presentation = new NpcSchedulePresentationResolver() }) { Object.assign(this,{repository,database,hours,presentation}) }
  resolve(npcId, serviceType, worldTime={hour:0,minute:0}, locationId=null) { const state=this.repository.state(npcId), present=visiblePresence(state)&&(!locationId||state.currentLocationId===locationId), allowed=state.interactionOverrides?.[serviceType]===true, available=present&&allowed&&[NPC_AVAILABILITY.AVAILABLE,NPC_AVAILABILITY.LIMITED].includes(state.availabilityState); return {ok:true,available,limited:available&&state.availabilityState===NPC_AVAILABILITY.LIMITED,npcId,serviceType,state:available?(state.availabilityState===NPC_AVAILABILITY.LIMITED?'Limited':'Open'):'Closed',reason:available?null:this.presentation.unavailable(state,serviceType),hours:this.hours.view(npcId,serviceType,worldTime),scheduleVersion:state.transitionSequence} }
  validateCallback(context, worldTime) { const current=this.resolve(context.npcId,context.serviceType,worldTime,context.locationId); return current.available&&current.scheduleVersion===context.scheduleVersion?{ok:true,code:'NPC_SERVICE_CALLBACK_VALID'}:{ok:false,code:'NPC_SERVICE_STALE_CALLBACK',current} }
}

export class NpcLocationRosterService {
  constructor({ repository, presence, services, names=DISPLAY_NAMES, presentation=new NpcSchedulePresentationResolver() }) { Object.assign(this,{repository,presence,services,names,presentation}) }
  roster(locationId, worldTime={hour:0,minute:0}) { return this.presence.index.at(locationId).map(npcId=>{const state=this.repository.state(npcId);return{npcId,displayName:this.names[npcId]??npcId,activity:this.presentation.activity(state),availability:state.availabilityState,locationId,services:Object.fromEntries(['Talk','Trade','Train','Learn','Craft','Rest'].map(type=>[type,this.services.resolve(npcId,type,worldTime,locationId)]))}}).sort((a,b)=>Number(b.services.Talk.available)-Number(a.services.Talk.available)||a.displayName.localeCompare(b.displayName)||a.npcId.localeCompare(b.npcId)) }
}

export class NpcMapIntegrationService {
  constructor(repository) { this.repository=repository; this.knowledge={} ; this.markers=new Map() }
  reveal(npcId, level='KnownRoutine') { this.knowledge[npcId]=level }
  refreshNpc(npcId) { const state=this.repository.state(npcId), level=this.knowledge[npcId]; if(!level||state.presenceState===NPC_PRESENCE.HIDDEN){this.markers.delete(npcId);return null} const exact=level==='KnownRoutine'||level==='Exact'; const marker={id:`npc:${npcId}`,npcId,kind:'Npc',accuracy:exact?'Exact':level==='LastKnown'?'LastKnown':'Approximate',locationId:exact?state.currentLocationId:state.previousLocationId??state.currentLocationId,availability:state.availabilityState,version:state.transitionSequence}; this.markers.set(npcId,marker);return marker }
  rebuild() { this.markers.clear(); for(const id of Object.keys(this.repository.runtime.states))this.refreshNpc(id); return [...this.markers.values()] }
  serialize(){return{knowledge:structuredClone(this.knowledge),markers:[...this.markers.values()]}}
}

export class NpcScheduleIntegrationCoordinator {
  constructor({repository,database}) { this.presence=new NpcPresenceService(repository); this.hours=new NpcServiceHoursResolver(database,repository); this.services=new NpcServiceAvailabilityResolver({repository,database,hours:this.hours}); this.rosters=new NpcLocationRosterService({repository,presence:this.presence,services:this.services}); this.map=new NpcMapIntegrationService(repository); this.repository=repository }
  rebuild(){this.presence.rebuild();this.map.rebuild();return this}
  afterProcessing(processingResult){for(const item of processingResult?.results??[]){if(!item.result?.ok)continue;this.presence.transition(item.npcId);this.map.refreshNpc(item.npcId)}return{rosterLocations:[...this.presence.index.byLocation.keys()],mapMarkers:[...this.map.markers.values()]}}
}
