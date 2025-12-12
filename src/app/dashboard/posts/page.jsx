"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/lib/userRole";
import { ROLES } from "@/lib/roles";
import { format } from "date-fns";

export default function PostsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { role, isLoading: roleLoading } = useUserRole();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!roleLoading) {
      if (role !== ROLES.ADMIN && role !== ROLES.MENTOR) {
        router.push("/dashboard");
        return;
      }
      fetchPosts();
    }
  }, [role, roleLoading]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Get access token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const params = new URLSearchParams({
        status: statusFilter,
        page: "1",
        limit: "50",
      });

      const headers = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/posts?${params}`, { headers });
      if (!response.ok) throw new Error("Failed to fetch posts");

      const { data } = await response.json();
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

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

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roleLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (role !== ROLES.ADMIN && role !== ROLES.MENTOR) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Posts Management</h1>
          <p className="text-gray-600">Manage your blog posts and articles</p>
        </div>
        <Button onClick={() => router.push("/dashboard/posts/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setTimeout(fetchPosts, 100);
          }}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending">Pending</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-500">Loading posts...</div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No posts found</p>
            <Button onClick={() => router.push("/dashboard/posts/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{post.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {post.status === "scheduled" && post.published_at
                          ? `Scheduled: ${format(new Date(post.published_at), "MMM d, yyyy h:mm a")}`
                          : post.published_at
                          ? format(new Date(post.published_at), "MMM d, yyyy")
                          : "Not published"}
                      </span>
                      {post.reading_time_minutes && (
                        <span>{post.reading_time_minutes} min read</span>
                      )}
                      {post.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.view_count} views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        post.status === "published"
                          ? "default"
                          : post.status === "scheduled"
                          ? "default"
                          : post.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                      className={post.status === "scheduled" ? "bg-blue-600" : ""}
                    >
                      {post.status}
                    </Badge>
                    {post.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {post.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {post.summary}
                  </p>
                )}
                <div className="flex gap-2">
                  {post.status === "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/blogs/${post.slug}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/posts/${post.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

