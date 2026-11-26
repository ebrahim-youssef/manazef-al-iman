export const categories = [
  {
    id: 'cosmetics',
    name: 'مستحضرات تجميل',
    slug: 'cosmetics',
    description: 'منتجات عناية شخصية وتجميل مختارة بعناية لمنزلك وعائلتك.',
    icon: 'sparkle',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cleaners',
    name: 'منظفات',
    slug: 'cleaners',
    description: 'منظفات منزلية فعالة لكل ركن في بيتك.',
    icon: 'bottle',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'industrial',
    name: 'منظفات صناعية',
    slug: 'industrial',
    description: 'حلول تنظيف قوية للاستخدامات المهنية والمصانع والمنشآت.',
    icon: 'factory',
    image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'groceries',
    name: 'جردوات',
    slug: 'groceries',
    description: 'مستلزمات يومية ومنتجات جردوات بجودة عالية وأسعار مناسبة.',
    icon: 'basket',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'wholesale',
    name: 'قسم الجملة',
    slug: 'wholesale',
    description: 'اشترِ بالكراتين ووفر أكثر مع أسعار الجملة المميزة.',
    icon: 'box',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'offers',
    name: 'عروض الجمعة',
    slug: 'offers',
    description: 'عروض وخصومات خاصة لفترة محدودة على منتجات مختارة.',
    icon: 'tag',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
  },
];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
