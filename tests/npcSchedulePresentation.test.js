import test from 'node:test'
import assert from 'node:assert/strict'
import { NpcScheduleDatabase } from '../src/npcSchedules/npcScheduleDatabase.js'
import { NPC_ASSIGNMENTS, npcScheduleDefinitions, SCHEDULE_LOCATIONS } from '../src/npcSchedules/npcScheduleDefinitions.js'
import { NpcScheduleRepository } from '../src/npcSchedules/npcScheduleRepository.js'
import { NpcScheduleProcessingService, NpcScheduleResolver } from '../src/npcSchedules/npcScheduleServices.js'
import { NpcLocationPresenceIndex, NpcScheduleIntegrationCoordinator } from '../src/npcSchedules/npcScheduleIntegrations.js'

const setup = (hour=8) => {
  const database=new NpcScheduleDatabase(npcScheduleDefinitions,Object.keys(NPC_ASSIGNMENTS),SCHEDULE_LOCATIONS)
  const repository=new NpcScheduleRepository()
  const resolver=new NpcScheduleResolver({database,repository,assignments:NPC_ASSIGNMENTS})
  const processing=new NpcScheduleProcessingService({database,repository,resolver})
  const coordinator=new NpcScheduleIntegrationCoordinator({database,repository})
  const result=processing.process(1,{hour,minute:0},{regionId:'meadows'})
  coordinator.afterProcessing(result)
  return {database,repository,processing,coordinator}
}

test('presence index is idempotent and prevents an NPC from occupying two locations',()=>{const index=new NpcLocationPresenceIndex(),state={presenceState:'Present',availabilityState:'Available',currentLocationId:'a'};index.update('npc',state);index.update('npc',state);assert.deepEqual(index.at('a'),['npc']);index.update('npc',{...state,currentLocationId:'b'});assert.deepEqual(index.at('a'),[]);assert.deepEqual(index.at('b'),['npc'])})
test('daily processing builds location rosters and removes absent NPCs',()=>{const {coordinator,repository}=setup(8);assert(coordinator.rosters.roster('general_store',{hour:8}).some(x=>x.npcId==='general_merchant'));repository.state('general_merchant').presenceState='Absent';coordinator.presence.transition('general_merchant');assert.equal(coordinator.rosters.roster('general_store',{hour:8}).length,0)})
test('merchant availability and public hours come from the schedule',()=>{const {coordinator}=setup(8),open=coordinator.services.resolve('general_merchant','Trade',{hour:8});assert.equal(open.available,true);assert.match(open.hours.display,/07:00/);const closed=coordinator.services.resolve('general_merchant','Trade',{hour:20});assert.equal(closed.available,true,'runtime state remains authoritative until time processing')})
test('time transition closes merchant service without touching merchant domain data',()=>{const {coordinator,processing}=setup(8);const result=processing.process(1,{hour:20,minute:0},{regionId:'meadows'});coordinator.afterProcessing(result);const closed=coordinator.services.resolve('general_merchant','Trade',{hour:20});assert.equal(closed.available,false);assert.match(closed.reason,/unavailable|time/i);assert.equal(closed.hours.next.label,'Tomorrow at 07:00')})
test('services expose limited availability and controlled reasons',()=>{const {coordinator}=setup(19);const talk=coordinator.services.resolve('general_merchant','Talk',{hour:19});assert.equal(talk.available,true);assert.equal(talk.limited,true);const trade=coordinator.services.resolve('general_merchant','Trade',{hour:19});assert.equal(trade.available,false);assert.ok(trade.reason)})
test('stale callbacks are rejected after schedule transition',()=>{const {coordinator,processing}=setup(8),service=coordinator.services.resolve('general_merchant','Trade',{hour:8});const context={npcId:'general_merchant',serviceType:'Trade',scheduleVersion:service.scheduleVersion};coordinator.afterProcessing(processing.process(1,{hour:20,minute:0},{regionId:'meadows'}));assert.equal(coordinator.services.validateCallback(context,{hour:20}).code,'NPC_SERVICE_STALE_CALLBACK')})
test('map marker knowledge does not reveal hidden NPCs',()=>{const {coordinator,repository}=setup(8);coordinator.map.reveal('hunter','KnownRoutine');assert(coordinator.map.refreshNpc('hunter'));repository.state('hunter').presenceState='Hidden';assert.equal(coordinator.map.refreshNpc('hunter'),null)})
test('known routine markers follow logical schedule transitions',()=>{const {coordinator,processing}=setup(8);coordinator.map.reveal('general_merchant','KnownRoutine');assert.equal(coordinator.map.refreshNpc('general_merchant').locationId,'general_store');coordinator.afterProcessing(processing.process(1,{hour:20,minute:0},{regionId:'meadows'}));assert.equal(coordinator.map.markers.get('general_merchant').locationId,'village_inn')})
test('rebuild restores presence and marker projections from saved runtime',()=>{const {coordinator}=setup(8);coordinator.map.reveal('blacksmith');coordinator.rebuild();assert(coordinator.presence.isPresent('blacksmith','forge'));assert.equal(coordinator.map.markers.get('blacksmith').locationId,'forge')})
test('roster presentation uses English labels and exposes no schedule ids',()=>{const {coordinator}=setup(8),item=coordinator.rosters.roster('forge',{hour:8})[0];assert.equal(item.displayName,'Blacksmith');assert.equal(item.activity,'Working');assert.equal('activeScheduleId' in item,false)})
