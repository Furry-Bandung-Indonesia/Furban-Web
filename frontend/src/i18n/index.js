import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      gallery: 'Gallery',
      blog: 'Blog',
      socials: 'Socials'
    },
    home: {
      title: 'Furban Community',
      subtitle: 'Welcome to our amazing community',
      learnMore: 'Learn More',
      viewGallery: 'View Gallery'
    },
    about: {
      title: 'Our Story',
      subtitle: 'Our Story'
    },
    gallery: {
      title: 'Gallery',
      subtitle: 'Explore our community moments',
      loadMore: 'Load More'
    },
    blog: {
      title: 'Blog',
      subtitle: 'Latest news and updates from our community',
      readMore: 'Read More'
    },
    socials: {
      title: 'Connect With Us',
      subtitle: 'Join our community on social platforms',
      contact: 'Contact Us'
    }
  },
  id: {
    nav: {
      home: 'Beranda',
      about: 'Tentang',
      gallery: 'Galeri',
      blog: 'Blog',
      socials: 'Sosial'
    },
    home: {
      title: 'Komunitas Furban',
      subtitle: 'Selamat datang di komunitas kami yang luar biasa',
      learnMore: 'Pelajari Lebih Lanjut',
      viewGallery: 'Lihat Galeri'
    },
    about: {
      title: 'Tentang Kami',
      subtitle: 'Cerita Kami'
    },
    gallery: {
      title: 'Galeri',
      subtitle: 'Jelajahi momen-momen komunitas kami',
      loadMore: 'Muat Lebih Banyak'
    },
    blog: {
      title: 'Blog',
      subtitle: 'Berita dan update terbaru dari komunitas kami',
      readMore: 'Baca Selengkapnya'
    },
    socials: {
      title: 'Terhubung Dengan Kami',
      subtitle: 'Bergabunglah dengan komunitas kami di platform sosial',
      contact: 'Hubungi Kami'
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

export default i18n