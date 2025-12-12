"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserRole } from "@/lib/userRole";
import { ROLES } from "@/lib/roles";
import PostEditor from "@/components/blogs/PostEditor";
import PostAnalytics from "@/components/blogs/PostAnalytics";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { role, isLoading } = useUserRole();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (role !== ROLES.ADMIN && role !== ROLES.MENTOR) {
        router.push("/dashboard");
        return;
      }
      fetchPost();
    }
  }, [role, isLoading, params.id]);

  const fetchPost = async () => {
    try {
      // Get access token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/posts/${params.id}`, { headers });
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/posts");
          return;
        }
        throw new Error("Failed to fetch post");
      }

      const { data } = await response.json();
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (role !== ROLES.ADMIN && role !== ROLES.MENTOR) {
    return null;
  }

  if (!post) {
    return <div className="p-8">Post not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2">
          <PostEditor post={post} />
        </div>
        
        {/* Analytics Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <PostAnalytics postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

