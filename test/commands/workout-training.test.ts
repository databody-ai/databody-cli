import {describe,it,expect,vi,beforeEach} from 'vitest';
import {Command} from 'commander';
vi.mock('../../src/lib/api.js',()=>({apiCall:vi.fn().mockResolvedValue({revision:4})}));
vi.mock('../../src/lib/output.js',()=>({output:vi.fn(),withErrorHandler:(f:unknown)=>f}));
import {apiCall} from '../../src/lib/api.js';
import {registerWorkoutsCommands} from '../../src/commands/workouts.js';
import {output} from '../../src/lib/output.js';

describe('structured workout commands',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it.each([['sets','remove','--set-id','set-2','remove_set','set_id'],['sessions','remove-move','--move-id','bench','remove_move','move_id']])('routes %s %s through pending-only commands',async(group,action,flag,id,type,key)=>{
  const p=new Command();registerWorkoutsCommands(p);
  await p.parseAsync(['node','databody','workouts',group,action,'--session-id','42','--expected-revision','3',flag,id,'--client-id','remove-retry']);
  expect(apiCall).toHaveBeenCalledWith('/workout_sessions/42/command','POST',{expected_revision:3,client_id:'remove-retry',[key]:id,type});
 });
 it('supports linked variation IDs including an empty clear',async()=>{
  const p=new Command();registerWorkoutsCommands(p);
  await p.parseAsync(['node','databody','workouts','moves','update','--move-id','7','--variation-ids','[]']);
  expect(apiCall).toHaveBeenCalledWith('/workout_moves/7','PATCH',{variation_ids:[]});
 });
 it.each(['cancel','delete'])('routes session %s through a revisioned command',async(type)=>{
  const p=new Command();registerWorkoutsCommands(p);
  await p.parseAsync(['node','databody','workouts','sessions',type,'--session-id','42','--expected-revision','3','--client-id',`${type}-retry`]);
  expect(apiCall).toHaveBeenCalledWith('/workout_sessions/42/command','POST',{expected_revision:3,client_id:`${type}-retry`,type});
 });
 it('logs actual reps and load with revision and caller retry ID',async()=>{
  const p=new Command();registerWorkoutsCommands(p);
  await p.parseAsync(['node','databody','workouts','sets','log','--session-id','42','--set-id','set-1','--expected-revision','3','--reps','8','--weight','135','--client-id','retry']);
  expect(apiCall).toHaveBeenCalledWith('/workout_sessions/42/command','POST',{set_id:'set-1',expected_revision:3,reps:8,weight:135,client_id:'retry',type:'confirm_set'});
 });
 it('supports complete program JSON and keeps legacy summary commands',async()=>{
  const p=new Command();registerWorkoutsCommands(p);
  const program={name:'Strength',days:[{name:'Upper',moves:[]}]};
  await p.parseAsync(['node','databody','workouts','programs','create','--json',JSON.stringify(program)]);
  expect(apiCall).toHaveBeenCalledWith('/workout_programs','POST',program);
  expect(p.commands[0].commands.map(c=>c.name())).toContain('recent');
 });
 it('exposes nested program schemas without authentication or an API request',async()=>{
  const p=new Command();registerWorkoutsCommands(p);
  await p.parseAsync(['node','databody','workouts','schema','create_workout_program']);
  expect(apiCall).not.toHaveBeenCalled();
  expect(output).toHaveBeenCalledWith(expect.objectContaining({
   name:'create_workout_program',method:'POST',path:'/workout_programs',
   inputSchema:expect.objectContaining({required:['name','days'],properties:expect.objectContaining({days:expect.objectContaining({type:'array'})})})
  }),undefined);
 });
 it('preserves nested sets, stable occurrence IDs and the revision when editing a program',async()=>{
  const p=new Command();registerWorkoutsCommands(p);
  const days=[{id:'upper-a',name:'Upper A',moves:[{id:'bench',move_id:7,sets:[{reps_min:6,reps_max:8,weight:135,rest_seconds:90}]}]}];
  await p.parseAsync(['node','databody','workouts','programs','update','--program-id','9','--expected-revision','2','--days',JSON.stringify(days)]);
  expect(apiCall).toHaveBeenCalledWith('/workout_programs/9','PATCH',{expected_revision:2,days});
 });
});
