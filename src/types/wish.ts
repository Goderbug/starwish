export interface WishData {
  id: string;
  title: string;
  description: string;
  category: 'gift' | 'experience' | 'moment';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  tags?: string[];
  imageUrl?: string;
  estimatedPrice?: string;
  notes?: string;
}

export interface WishBox {
  id: string;
  name: string;
  wishIds: string[];
  createdAt: string;
  expiresAt?: string;
  description?: string;
  theme: 'cosmic' | 'romantic' | 'dreamy' | 'magical';
}