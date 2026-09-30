import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
 head: () => ({meta:[{title:"Aeronova Engineering — Espace de travail"},{name:"description",content:"Accédez à votre espace de travail Aeronova Engineering."},{property:"og:title",content:"Aeronova Engineering — Espace de travail"},{property:"og:description",content:"Accédez à votre espace de travail Aeronova Engineering."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
 beforeLoad: () => {throw redirect({to:"/dashboard"})},
 component: () => null,
});
