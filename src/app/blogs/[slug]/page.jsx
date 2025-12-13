"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CommentSection from "@/components/blogs/CommentSection";
import LikeButton from "@/components/blogs/LikeButton";
import TagList from "@/components/blogs/TagList";
import FeedbackSection from "@/components/feedback/FeedbackSection";
import { supabase } from "@/lib/supabase";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
  }, [slug]);

  useEffect(() => {
    if (post && currentUser) {
      checkLikeStatus();
    }
  }, [post, currentUser]);

  const fetchCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user || null);
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setPost(null);
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

  const checkLikeStatus = async () => {
    if (!currentUser || !post) return;

    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setLiked(true);
      }

      // Get like count
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      setLikeCount(count || 0);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-500">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blogs">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = post.published_at
    ? format(new Date(post.published_at), "MMMM d, yyyy")
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/blogs">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blogs
        </Button>
      </Link>

      <article>
        <header className="mb-8">
          {post.cover_url && (
            <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden">
              <Image
                src={post.cover_url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

          {post.summary && (
            <p className="text-xl text-gray-600 mb-6">{post.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {post.author?.email && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author.email.split("@")[0]}</span>
              </div>
            )}
            {publishedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{publishedDate}</span>
              </div>
            )}
            {post.reading_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.reading_time_minutes} min read</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <TagList tags={post.tags} />
            {currentUser && (
              <LikeButton
                postId={post.id}
                initialLiked={liked}
                initialCount={likeCount}
                onLikeChange={(newLiked, newCount) => {
                  setLiked(newLiked);
                  setLikeCount(newCount);
                }}
              />
            )}
          </div>
        </header>

        <div className="prose prose-lg max-w-none mb-12">
          <div className="whitespace-pre-wrap">{post.content}</div>
        </div>

        <footer className="border-t pt-8 space-y-8">
          <FeedbackSection feedbackType="article" referenceId={post.id} />
          <CommentSection postId={post.id} />
        </footer>
      </article>
    </div>
  );
}

