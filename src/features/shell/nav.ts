import { LayoutDashboard, Users, HardHat, MapPin, CalendarDays, ClipboardList, CheckSquare2, AlertTriangle, FileText, Images, Search, Bell, UsersRound, Trash2, ScrollText, Settings2, type LucideIcon } from 'lucide-react';
export const navigation: { key: string; path: string; icon: LucideIcon; group: string; adminOnly?: boolean; desktopOnly?: boolean }[] = [
{key:'dashboard',path:'/dashboard',icon:LayoutDashboard,group:'overview'},
{key:'clients',path:'/clients',icon:Users,group:'overview'},
{key:'sites',path:'/sites',icon:HardHat,group:'overview'},
{key:'visits',path:'/visits',icon:MapPin,group:'fieldwork'},
{key:'calendar',path:'/calendar',icon:CalendarDays,group:'fieldwork'},
{key:'meetings',path:'/meetings',icon:ClipboardList,group:'fieldwork'},
{key:'tasks',path:'/tasks',icon:CheckSquare2,group:'fieldwork'},
{key:'problems',path:'/problems',icon:AlertTriangle,group:'fieldwork'},
{key:'photos',path:'/photos',icon:Images,group:'fieldwork'},
{key:'reports',path:'/reports',icon:FileText,group:'management',adminOnly:true},
{key:'search',path:'/search',icon:Search,group:'management'},
{key:'notifications',path:'/notifications',icon:Bell,group:'management',adminOnly:true,desktopOnly:true},
{key:'team',path:'/team',icon:UsersRound,group:'management',adminOnly:true},
{key:'trash',path:'/trash',icon:Trash2,group:'management',adminOnly:true},
{key:'audit',path:'/audit',icon:ScrollText,group:'management',adminOnly:true},
{key:'settings',path:'/settings',icon:Settings2,group:'management',adminOnly:true},
];
