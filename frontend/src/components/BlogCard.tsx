
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CalendarDays, User } from "lucide-react";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageSrc: string;
  author: string;
  date: string;
  readTime: string;
}

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`/blog/${post.id}`}>
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={post.imageSrc} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-white py-1 px-2 rounded-full text-xs font-medium">
            {post.category}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 mb-2">{post.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0 flex justify-between text-sm text-gray-500 border-t">
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>{post.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays size={14} />
          <span>{post.date} • {post.readTime}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BlogCard;
