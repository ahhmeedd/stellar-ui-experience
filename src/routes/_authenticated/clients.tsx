import { createFileRoute } from '@tanstack/react-router';
import { EmptySection } from '@/features/shell/Content';
export const Route=createFileRoute('/_authenticated/clients')({head:()=>({meta:[{title:'Clients — Aeronova Engineering'},{name:'description',content:'Espace Clients de l’équipe Aeronova Engineering.'},{property:'og:title',content:'Clients — Aeronova Engineering'},{property:'og:description',content:'Espace Clients de l’équipe Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <EmptySection title="clients"/>});
