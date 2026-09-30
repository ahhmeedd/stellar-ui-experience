import { createFileRoute } from '@tanstack/react-router';
import { Login } from '@/features/auth/Login';
export const Route=createFileRoute('/auth')({head:()=>({meta:[{title:'Connexion — Aeronova Engineering'},{name:'description',content:'Accès sécurisé à l’espace de travail Aeronova Engineering.'},{property:'og:title',content:'Connexion — Aeronova Engineering'},{property:'og:description',content:'Accès sécurisé à l’espace de travail Aeronova Engineering.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Login});
