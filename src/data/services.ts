import { BarberService } from '../types';
import facialImg from '../assets/images/facial_cleansing_1790806021159.jpg';
import toolsImg from '../assets/images/barber_tools_1790806008904.jpg';
import heroImg from '../assets/images/barbershop_hero_1790805996946.jpg';

export const SERVICES: BarberService[] = [
  {
    id: 'deep-cleanse',
    name: 'عرض التنظيف العميق',
    price: 20000,
    priceFormatted: '20,000 د.ع',
    description: 'مع أجهزة متطورة للتنظيف ونظافة عامة.',
    category: 'cleaning',
    durationMinutes: 45,
    highlighted: true,
    image: facialImg,
  },
  {
    id: 'regular-cleanse',
    name: 'عرض التنظيف العادي',
    price: 15000,
    priceFormatted: '15,000 د.ع',
    description: 'تنظيف مسام متقن مع بخار مرطب وماسك منعش لتنقية البشرة وإزالة الشوائب.',
    category: 'cleaning',
    durationMinutes: 30,
    image: facialImg,
  },
  {
    id: 'haircut-only',
    name: 'حلاقة فقط',
    price: 10000,
    priceFormatted: '10,000 د.ع',
    description: 'قص وتصفيف الشعر بأحدث التسريحات مع غسيل وسشوار احترافي متكامل.',
    note: 'يتغير السعر للأقل عندما أعرف نوع الشعر والعمل',
    category: 'haircut',
    durationMinutes: 25,
    highlighted: true,
    image: heroImg,
  },
  {
    id: 'trim-no-beard',
    name: 'تحديد بدون لحية',
    price: 3000,
    priceFormatted: '3,000 د.ع',
    description: 'تحديد حواف الشعر، الرقبة والزوالف بدقة عالية وتنسيق نظيف بالموس المعقم.',
    category: 'haircut',
    durationMinutes: 15,
    image: toolsImg,
  },
  {
    id: 'beard-fade',
    name: 'تحديد وتدريج اللحية',
    price: 5000,
    priceFormatted: '5,000 د.ع',
    description: 'مع نضارة خفيفة للبشرة.',
    category: 'beard',
    durationMinutes: 20,
    highlighted: true,
    image: toolsImg,
  },
];
