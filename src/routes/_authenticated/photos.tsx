import { createFileRoute } from '@tanstack/react-router';
import { EmptySection } from '@/features/shell/Content';
export const Route=createFileRoute('/_authenticated/photos')({head:()=>({meta:[{title:'Photos — Aeronova Engineering'},{name:'description',content:'Espace Photos de l’équipe Aeronova Engineering.'},{property:'og:title',content:'Photos — Aeronova Engineering'},{property:'og:description',content:'Espace Photos de l’équipe Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <EmptySection title="photos"/>});
