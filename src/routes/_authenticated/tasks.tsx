import { createFileRoute } from '@tanstack/react-router';
import { EmptySection } from '@/features/shell/Content';
export const Route=createFileRoute('/_authenticated/tasks')({head:()=>({meta:[{title:'Tâches — Aeronova Engineering'},{name:'description',content:'Espace Tâches de l’équipe Aeronova Engineering.'},{property:'og:title',content:'Tâches — Aeronova Engineering'},{property:'og:description',content:'Espace Tâches de l’équipe Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <EmptySection title="tasks"/>});
