const products = [
    {
        id: 1,
        name: "Classic Leather Backpack",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        description:
            "A durable leather backpack with a spacious interior, padded laptop compartment, and adjustable shoulder straps. Perfect for work, school, or everyday travel.",
    },
    {
        id: 2,
        name: "Minimalist Wrist Watch",
        price: 129.99,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        description:
            "A clean and timeless wrist watch featuring a minimalist dial and comfortable strap. Designed to complement both casual and formal outfits.",
    },
    {
        id: 3,
        name: "Wireless Headphones",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description:
            "Premium wireless headphones with comfortable ear cushions, immersive sound, and a long-lasting battery for music, calls, and entertainment.",
    },
    {
        id: 4,
        name: "Modern Running Shoes",
        price: 94.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        description:
            "Lightweight running shoes designed for everyday comfort and active lifestyles. Featuring a cushioned sole and breathable upper.",
    },
    {
        id: 5,
        name: "Ceramic Coffee Mug",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
        description:
            "A stylish ceramic coffee mug with a simple modern design. Ideal for coffee, tea, hot chocolate, or your favorite morning drink.",
    },
    {
        id: 6,
        name: "Premium Sunglasses",
        price: 59.99,
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        description:
            "Modern sunglasses combining a lightweight frame with classic styling. A versatile accessory for everyday wear and outdoor activities.",
    },
    {
        id: 7,
        name: "Smartphone",
        price: 699.99,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        description:
            "A modern smartphone featuring a vibrant display, powerful performance, high-quality camera, and all-day battery life.",
    },
    {
        id: 8,
        name: "Mechanical Keyboard",
        price: 119.99,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        description:
            "A responsive mechanical keyboard built for comfortable typing and gaming. Features tactile keys and a durable compact design.",
    },
    {
        id: 9,
        name: "Cotton Hoodie",
        price: 64.99,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
        description:
            "A soft cotton-blend hoodie designed for everyday comfort. Features a relaxed fit, adjustable hood, and spacious front pocket.",
    },
    {
        id: 10,
        name: "Leather Wallet",
        price: 44.99,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
        description:
            "A compact leather wallet with multiple card slots and a practical cash compartment. Slim enough for everyday carry.",
    },
    {
        id: 11,
        name: "Modern Desk Lamp",
        price: 54.99,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
        description:
            "A contemporary desk lamp that provides focused lighting for reading, studying, or working while adding a clean look to your workspace.",
    },
    {
        id: 12,
        name: "Travel Water Bottle",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
        description:
            "A reusable insulated water bottle designed to keep drinks at the desired temperature throughout the day. Perfect for work, travel, and workouts.",
    },
];

export function getProducts() {
    return products;
}

export function getProductById(id){
    return products.find(p => p.id === Number(id))
}