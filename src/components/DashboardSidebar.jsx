"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Home,
    User,
    Search,
    BookOpen,
    Calendar,
    MessageSquare,
    Users,
    FileText,
    Crown,
    PenTool,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useUserRole } from "@/lib/userRole";
import { supabase } from "@/lib/supabase";
import { ROLES } from "@/lib/roles";

function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { role, isLoading, user } = useUserRole();

    // Define navigation items based on roles
    const roleItems = {
        admin: [
            { icon: Users, label: "Manage Users", href: "/dashboard/admin/users" },
            {
                icon: FileText,
                label: "Mentor Applications",
                href: "/dashboard/admin/mentor-applications",
            },
            {
                icon: Crown,
                label: "User Subscriptions",
                href: "/dashboard/admin/subscriptions",
            },
            {
                icon: FileText,
                label: "Add Events",
                href: "/dashboard/admin/events",
            },
            {
                icon: FileText,
                label: "Resources",
                href: "/dashboard/admin/resources",
            },
            {
                icon: FileText,
                label: "News",
                href: "/dashboard/admin/news-automation",
            },
            {
                icon: PenTool,
                label: "Posts",
                href: "/dashboard/posts",
            },
        ],
        mentor: [
            {
                icon: User,
                label: "Profile",
                href: "/dashboard/mentor/profile",
            },
            {
                icon: Calendar,
                label: "My Events",
                href: "/dashboard/mentor/events",
            },
            {
                icon: PenTool,
                label: "Posts",
                href: "/dashboard/posts",
            },
        ],
        pending_mentor: [
            {
                icon: User,
                label: "Profile",
                href: "/dashboard/mentor/profile",
            },
            {
                icon: Calendar,
                label: "My Events",
                href: "/dashboard/mentor/events",
            },
        ],
        mentee: [       
            {
                icon: Search,
                label: "Find Mentor",
                href: "/dashboard/mentee/findmentor",
            },
            {
                icon: Calendar,
                label: "My Sessions",
                href: "/dashboard/mentee/sessions",
            },
            {
                icon: MessageSquare,
                label: "Events",
                href: "/dashboard/mentee/events",
            },
            {
                icon: FileText,
                label: "Resources",
                href: "/dashboard/mentee/resources",
            },
        ],
    };

    // Get navigation items based on current role
    const getNavItems = () => {
        if (!role) return [];

        const baseItems = [
            { href: "dashboard", label: "Dashboard", icon: Home }
        ];

        const roleSpecificItems = roleItems[role] || [];

        return [...baseItems, ...roleSpecificItems];
    };

    const navItems = getNavItems();

    // Determine the base dashboard path based on role
    const getBaseDashboardPath = () => {
        switch (role) {
            case ROLES.MENTEE:
                return '/dashboard/mentee';
            case ROLES.MENTOR:
                return '/dashboard/mentor';
            case ROLES.ADMIN:
                return '/dashboard/admin';
            case ROLES.PENDING_MENTOR:
                return '/dashboard/mentor'; // Pending mentors now go to mentor dashboard
            default:
                return '/dashboard';
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full bg-black text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <div className="animate-pulse">
                        <div className="h-10 w-32 bg-gray-700 rounded"></div>
                        <div className="h-3 w-20 bg-gray-700 rounded mt-2"></div>
                    </div>
                </div>
                <div className="flex-1 p-4">
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

     return (
         <div className="h-screen bg-black text-white flex flex-col fixed left-0 top-0 w-64 z-40">
             {/* Sidebar Header with Logo */}
             <div className="p-6 border-b border-gray-800">
                 <div className="flex items-center space-x-3">
                     <div className="flex flex-col items-center">
                         <a href="/">
                             <img src="/logo.png" alt="Mentorle" className="h-10 w-auto" />
                         </a>
                         <p className="text-xs text-gray-400 ml-2 mt-0">Rise Together</p>
                     </div>
                 </div>
             </div>
             
             {/* Navigation Links */}
             <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
                 {navItems.map(({ href, label, icon: Icon }) => {
                     // Handle dynamic dashboard routing
                     const actualHref = href === "dashboard" ? getBaseDashboardPath() : href;
                     let isActive = false;
                     
                     if (href === "dashboard") {
                         // For dashboard link, check if we're on the exact dashboard path (not a sub-path)
                         isActive = pathname === getBaseDashboardPath();
                     } else {
                         // For other links, check exact match or if pathname starts with the href
                         isActive = pathname === actualHref || pathname.startsWith(actualHref + "/");
                     }

                     return (
                         <Link
                             key={href}
                             href={actualHref}
                             className={cn(
                                 "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                                 isActive
                                     ? "bg-white text-black shadow-lg"
                                     : "text-gray-300 hover:bg-gray-900 hover:text-white hover:translate-x-1"
                             )}
                         >
                             <Icon className={cn(
                                 "h-5 w-5 transition-colors",
                                 isActive ? "text-black" : "text-gray-400 group-hover:text-white"
                             )} />
                             <span className="font-medium">{label}</span>
                         </Link>
                     );
                 })}
             </nav>

             {/* User Info and Logout */}
             <div className="p-4 border-t border-gray-800">                 
                 <div className="text-xs text-gray-500 text-center mt-4">
                     © 2025 Mentorle
                 </div>
             </div>
         </div>
     );
}

export default DashboardSidebar;
