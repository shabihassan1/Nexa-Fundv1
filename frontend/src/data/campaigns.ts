
export interface Campaign {
  id: string;
  title: string;
  category: string;
  image: string;
  creator: string;
  raised: number;
  goal: number;
  backers: number;
  daysLeft: number;
  description: string;
  story: string;
}

export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "Eco-friendly Water Bottle",
    category: "Environment",
    image: "/placeholder.svg",
    creator: "Green Earth Co.",
    raised: 12500,
    goal: 25000,
    backers: 230,
    daysLeft: 15,
    description: "A reusable water bottle made from recycled ocean plastic.",
    story: "We're on a mission to reduce plastic waste in our oceans. Our innovative water bottle is made from 100% recycled ocean plastic, helping to clean our seas while providing a durable, stylish product that will last for years."
  },
  {
    id: "2",
    title: "Innovative Smart Garden",
    category: "Technology",
    image: "/placeholder.svg",
    creator: "TechGrow",
    raised: 35000,
    goal: 50000,
    backers: 410,
    daysLeft: 25,
    description: "An automated indoor garden system for urban homes.",
    story: "The Smart Garden enables anyone to grow fresh vegetables and herbs right in their kitchen. Using advanced hydroponic technology and automated light cycles, it makes home gardening simple and accessible for everyone, regardless of space or experience."
  },
  {
    id: "3",
    title: "Children's Educational App",
    category: "Education",
    image: "/placeholder.svg",
    creator: "Learn & Play",
    raised: 18000,
    goal: 30000,
    backers: 320,
    daysLeft: 20,
    description: "Interactive app that makes learning fun for kids aged 3-8.",
    story: "Our team of educators and game designers have created an app that combines educational content with engaging gameplay. Children can learn math, reading, and science concepts while having fun with colorful characters and exciting challenges."
  },
  {
    id: "4",
    title: "Documentary Film: Ocean Life",
    category: "Film & Video",
    image: "/placeholder.svg",
    creator: "Blue Planet Productions",
    raised: 45000,
    goal: 80000,
    backers: 520,
    daysLeft: 35,
    description: "A breathtaking documentary showcasing underwater ecosystems.",
    story: "Our team of experienced filmmakers and marine biologists will capture stunning footage of ocean life around the world. The documentary aims to raise awareness about marine conservation and the incredible diversity of life beneath the waves."
  },
  {
    id: "5",
    title: "Sustainable Fashion Line",
    category: "Fashion",
    image: "/placeholder.svg",
    creator: "EcoStyle",
    raised: 22000,
    goal: 40000,
    backers: 280,
    daysLeft: 18,
    description: "Clothing made from organic, fair-trade materials.",
    story: "We believe fashion shouldn't come at the expense of our planet or its people. Our line uses only organic cotton, recycled polyester, and natural dyes, all produced in factories with fair labor practices and sustainable manufacturing processes."
  },
  {
    id: "6",
    title: "Indie Game Development",
    category: "Games",
    image: "/placeholder.svg",
    creator: "Pixel Dreams Studio",
    raised: 28000,
    goal: 60000,
    backers: 650,
    daysLeft: 40,
    description: "A story-driven adventure game with hand-drawn animation.",
    story: "Our small team of passionate developers is creating an immersive gaming experience with unique hand-drawn art, original soundtrack, and a compelling narrative. We're bringing back the golden age of adventure games with modern gameplay mechanics."
  },
  {
    id: "7",
    title: "Community Art Space",
    category: "Art",
    image: "/placeholder.svg",
    creator: "Creative Commons",
    raised: 15000,
    goal: 35000,
    backers: 210,
    daysLeft: 28,
    description: "Converting an abandoned building into a public art gallery and workshop space.",
    story: "Our neighborhood lacks accessible creative spaces. We're transforming a vacant building into a vibrant community hub where local artists can exhibit their work, teach classes, and collaborate on projects. The space will be open to everyone, regardless of background or experience."
  },
  {
    id: "8",
    title: "Health Monitoring Wearable",
    category: "Health & Fitness",
    image: "/placeholder.svg",
    creator: "VitalTech",
    raised: 65000,
    goal: 100000,
    backers: 720,
    daysLeft: 22,
    description: "Advanced fitness tracker with comprehensive health metrics.",
    story: "Going beyond steps and heart rate, our wearable provides detailed insights into sleep quality, stress levels, and overall wellness. The accompanying app offers personalized recommendations based on your unique health data, helping you optimize your lifestyle for better health outcomes."
  }
];

export const categories = [
  "All Categories",
  "Technology",
  "Environment",
  "Education",
  "Film & Video",
  "Fashion",
  "Games",
  "Art",
  "Health & Fitness"
];
