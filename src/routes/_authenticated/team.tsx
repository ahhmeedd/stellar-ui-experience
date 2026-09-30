import { createFileRoute } from '@tanstack/react-router';
import { EmptySection } from '@/features/shell/Content';
export const Route=createFileRoute('/_authenticated/team')({head:()=>({meta:[{title:'Équipe — Aeronova Engineering'},{name:'description',content:'Espace Équipe de l’équipe Aeronova Engineering.'},{property:'og:title',content:'Équipe — Aeronova Engineering'},{property:'og:description',content:'Espace Équipe de l’équipe Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <EmptySection title="team"/>});
