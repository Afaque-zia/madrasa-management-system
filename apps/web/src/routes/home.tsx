import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { Workspace } from '@/components/home/workspace';
export function meta({matches,location}:Route.MetaArgs){return seo({matches,location},{title:'Schoolspace — School management workspace',description:'A colorful, multilingual single-school workspace for admissions, attendance, expenses, academics and school operations.'});}
export default function HomePage(){return <Workspace/>;}
