import { createFileRoute } from '@tanstack/react-router';
import { EmptySection } from '@/features/shell/Content';
export const Route=createFileRoute('/_authenticated/visits')({head:()=>({meta:[{title:'Visites — Aeronova Engineering'},{name:'description',content:'Espace Visites de l’équipe Aeronova Engineering.'},{property:'og:title',content:'Visites — Aeronova Engineering'},{property:'og:description',content:'Espace Visites de l’équipe Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <EmptySection title="visits"/>});
