
import { useState } from 'react';

const categories = [
  { id: 'all', name: 'All Projects' },
  { id: 'Technology', name: 'Technology' },
  { id: 'Arts', name: 'Creative' },
  { id: 'Community', name: 'Community' },
  { id: 'Education', name: 'Education' },
  { id: 'Environment', name: 'Environment' },
];

interface CategoryFilterProps {
  onSelectCategory: (categoryId: string) => void;
}

const CategoryFilter = ({ onSelectCategory }: CategoryFilterProps) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onSelectCategory(categoryId);
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-4 justify-center pb-8">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition-colors ${
            activeCategory === category.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
