import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogCard, { BlogPost } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";

// Sample blog posts data
const blogPosts: BlogPost[] = [
  {
    id: "2",
    title: "Helping a local business reinvent itself",
    excerpt: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
    category: "Business",
    imageSrc: "https://images.unsplash.com/photo-1460794418188-1bb7dba2720d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    author: "Michael Rodriguez",
    date: "April 22, 2023",
    readTime: "7 min read"
  },
  {
    id: "3",
    title: "How to design your site footer like we did",
    excerpt: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo.",
    category: "Design",
    imageSrc: "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2036&q=80",
    author: "Emma Davis",
    date: "March 10, 2023",
    readTime: "4 min read"
  },
  {
    id: "4",
    title: "Caring is the new marketing",
    excerpt: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias.",
    category: "Marketing",
    imageSrc: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    author: "John Smith",
    date: "February 18, 2023",
    readTime: "6 min read"
  },
  {
    id: "5",
    title: "How to build a strong remote culture",
    excerpt: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    category: "Business",
    imageSrc: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    author: "Lisa Wang",
    date: "January 5, 2023",
    readTime: "8 min read"
  },
  {
    id: "6",
    title: "The impact of crowdfunding on small businesses",
    excerpt: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
    category: "Finance",
    imageSrc: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    author: "David Chen",
    date: "December 12, 2022",
    readTime: "5 min read"
  }
];

const Blog = () => {
  const [category, setCategory] = useState("all");
  
  const filteredPosts = category === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our <span className="gradient-text">Blog</span></h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Latest news, insights, and stories from our crowdfunding community
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {["all", "design", "business", "marketing", "finance"].map((cat) => (
              <Button 
                key={cat}
                variant={category === cat ? "default" : "outline"}
                className={category === cat ? "bg-green-500 hover:bg-green-600" : ""}
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
