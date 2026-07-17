import{createNpcScheduleRuntime,createNpcScheduleState}from'./npcScheduleModels.js'
export class NpcScheduleRepository{constructor(runtime={}){this.runtime=createNpcScheduleRuntime(runtime)}state(id){return this.runtime.states[id]??(this.runtime.states[id]=createNpcScheduleState(id))}serialize(){return structuredClone(this.runtime)}reset(){this.runtime=createNpcScheduleRuntime()}}
