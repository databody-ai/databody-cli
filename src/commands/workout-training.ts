import { Command } from "commander";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import contractData from "../lib/workout-tools.json";
import { apiCall } from "../lib/api.js";
import { output, withErrorHandler } from "../lib/output.js";

type Property = {type:string;description?:string};
type Definition = {name:string;description:string;method:string;path:string;operation:string;command?:string;inputSchema:{properties:Record<string,Property>;required:string[]}};
const contract = contractData as unknown as Definition[];
const routes: Record<string,[string,string]> = {
 list_workout_moves:['moves','list'], create_workout_move:['moves','create'], update_workout_move:['moves','update'], archive_workout_move:['moves','archive'], get_move_history:['moves','history'],
 list_workout_programs:['programs','list'], get_workout_program:['programs','get'], create_workout_program:['programs','create'], update_workout_program:['programs','update'], archive_workout_program:['programs','archive'],
 get_active_workout_session:['sessions','active'], get_workout_session:['sessions','get'], list_workout_sessions:['sessions','list'], start_workout_session:['sessions','start'], import_workout_session:['sessions','import'],
 pause_workout_session:['sessions','pause'], resume_workout_session:['sessions','resume'], complete_workout_session:['sessions','complete'], cancel_workout_session:['sessions','cancel'], delete_workout_session:['sessions','delete'], advance_workout_session:['sessions','next'], add_workout_session_move:['sessions','add-move'], set_next_workout_move:['sessions','set-next'],
 log_workout_set:['sets','log'], update_workout_set:['sets','update'], undo_workout_set:['sets','undo'], set_workout_set_weight:['sets','weight'], get_workout_progression:['progression','get'], apply_workout_progression:['progression','apply'],
 return_to_workout_rest:['sessions','rest'], replace_workout_session_move:['sessions','replace-move'], remove_workout_session_move:['sessions','remove-move'], remove_workout_session_set:['sets','remove'],
 set_workout_session_notes:['sessions','notes'], set_workout_move_notes:['sessions','move-notes'], get_workout_move_performance:['moves','performance'], get_workout_session_performance:['sessions','performance'],
};
const camel = (key:string) => key.replace(/_([a-z])/g,(_,c:string)=>c.toUpperCase());

export function prepareWorkoutRequest(definition:Definition,input:Record<string,unknown>) {
 const body={...input};
 const path=definition.path.replace(/\{(\w+)\}/g,(_,key:string)=>{if(body[key]===undefined)throw new Error(`${key} is required`);const v=String(body[key]);delete body[key];return encodeURIComponent(v)});
 if(['command','start_session','import_session'].includes(definition.operation))body.client_id??=randomUUID();
 if(definition.command)body.type=definition.command;
 if(definition.method==='GET')return {path:path+(Object.keys(body).length?'?'+new URLSearchParams(Object.entries(body).map(([k,v]):[string,string]=>[k,String(v)])):''),method:'GET',body:undefined};
 return {path,method:definition.method,body};
}

export function registerWorkoutTrainingCommands(workouts:Command,program:Command) {
 workouts.command('schema').description('Print all structured workout tool schemas, or the schema for one MCP tool; no authentication needed').argument('[tool]','Tool name, e.g. create_workout_program').action(withErrorHandler(async(name?:string)=>{
  const definition=name?contract.find(tool=>tool.name===name):undefined;
  if(name&&!definition)throw new Error(`Unknown workout tool: ${name}`);
  output(definition||contract,program.opts().pretty);
 }));
 const groups = new Map<string,Command>();
 for(const definition of contract){
  const [group,name]=routes[definition.name];
  if(!groups.has(group))groups.set(group,workouts.command(group).description(`Structured workout ${group}`));
  const command=groups.get(group)!.command(name).description(definition.description).option('--json <json>','Structured JSON arguments').option('--file <path>','JSON arguments from a file; use - for stdin');
  for(const [key,property] of Object.entries(definition.inputSchema.properties))command.option(`--${key.replaceAll('_','-')} <value>`,property.description);
  command.action(withErrorHandler(async(options:Record<string,string|undefined>)=>{
   if(options.file&&options.json)throw new Error('Use either --file or --json');
   const raw=options.file?readFileSync(options.file==='-'?0:options.file,'utf8'):options.json;
   const input:Record<string,unknown>=raw?JSON.parse(raw):{};
   if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Arguments must be a JSON object');
   for(const [key,property] of Object.entries(definition.inputSchema.properties)){
    const value=options[camel(key)];if(value===undefined)continue;
    input[key]=['integer','number','boolean','array','object'].includes(property.type)?JSON.parse(value):value;
   }
   if(['start_session','import_session','command'].includes(definition.operation))input.client_id??=randomUUID();
   for(const key of definition.inputSchema.required)if(input[key]===undefined)throw new Error(`${key} is required`);
   const request=prepareWorkoutRequest(definition,input);
   output(await apiCall(request.path,request.method,request.body),program.opts().pretty);
  }));
 }
}
