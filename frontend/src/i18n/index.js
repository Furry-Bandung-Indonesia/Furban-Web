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
      subtitle: 'Our Story',
      description1: 'Furban, short for Furry Bandung, is a regional community focused on fans of furry culture in the Bandung area and its surroundings. This community aims to provide a space for individuals interested in art, costumes, and anthropomorphic characters to gather, share ideas, and express themselves in a friendly and supportive environment.',
      description2: 'Since May 11, 2017 until now, Furban has accommodated more than 100 members from various different backgrounds.',
      members: 'Community Members'
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
    },
    footer: {
      tagline: 'Furry Bandung - Personal Project by Tatsuya Ryu',
      links: 'Links',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      faq: 'FAQ',
      contactAndSocials: 'Contact & Socials',
      comingSoon: 'More coming soon',
      rights: 'All rights reserved.'
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: February 19, 2026',
      intro: 'Furban ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services, including the event ticketing system.',
      section1Title: '1. Information We Collect',
      section1Content: 'We collect information you provide directly to us, such as when you create an account, upload content, purchase event tickets, or contact us. This may include your name, email address, username, date of birth, phone number, and any content you submit (photos, blog posts, etc.).',
      section2Title: '2. Ticketing & Event Data',
      section2Content: 'When you purchase a ticket for an event, we collect and store additional information required for event management, including your full name, date of birth, phone number, dietary preferences (food selection), fursuiter status, and payment transaction records. This data is necessary to issue your ticket, facilitate check-in, and manage event logistics.',
      section3Title: '3. How We Use Your Information',
      section3Content: 'We use the information we collect to operate and improve our platform, manage user accounts, process ticket purchases and payments, facilitate event check-in procedures, display approved content in the gallery and blog, communicate with you about updates and event information, prevent fraud and enforce our terms, and ensure the security of our services.',
      section4Title: '4. Data Sharing with Event Organisers',
      section4Content: 'When you purchase a ticket, your personal information (name, contact details, dietary preferences) may be shared with the event organiser solely for the purposes of event management, check-in, and attendee coordination. Event organisers are bound by our terms to handle your data responsibly and must not share it with unauthorised third parties.',
      section5Title: '5. Data Storage & Security',
      section5Content: 'Your data is stored securely using Cloudflare infrastructure (D1 for database, R2 for media storage). We implement appropriate security measures including JWT-based authentication, password hashing, rate limiting, and moderation systems to protect your personal information and prevent unauthorised access.',
      section6Title: '6. Content Sharing',
      section6Content: 'Content you upload (photos, blog posts) will only be visible publicly after approval by an administrator. Rejected content will not be displayed publicly. You retain ownership of the content you create.',
      section7Title: '7. Cookies & Local Storage',
      section7Content: 'We use local storage to maintain your session (JWT tokens) and preferences (language setting, dark mode). We do not use third-party tracking cookies.',
      section8Title: '8. Data Retention',
      section8Content: 'Account data is retained as long as your account is active. Ticket and transaction records are retained for record-keeping and audit purposes even after the event has concluded. If your account is deregistered due to a terms violation, we may retain minimal records necessary for enforcement and fraud prevention.',
      section9Title: '9. Your Rights',
      section9Content: 'You have the right to access, update, or request deletion of your personal data. You may also request a copy of your data. Note that deletion of ticket transaction records may be restricted by legal or contractual obligations. Contact us at contact@furban.my.id for any privacy-related requests.',
      section10Title: '10. Changes to This Policy',
      section10Content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with a revised date.',
      section11Title: '11. Contact',
      section11Content: 'If you have questions about this Privacy Policy, please contact us at contact@furban.my.id.'
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: February 19, 2026',
      intro: 'By accessing or using the Furban platform, including the event ticketing system, you agree to be bound by these Terms of Service. Please read them carefully.',
      section1Title: '1. Acceptance of Terms',
      section1Content: 'By creating an account, purchasing a ticket, or using our services, you acknowledge that you have read, understood, and agree to these terms. If you do not agree, please do not use the platform.',
      section2Title: '2. User Accounts',
      section2Content: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and ticket purchases. Each person may only have one account. Providing false personal information (including name, date of birth, or contact details) is a violation of these terms.',
      section3Title: '3. User Roles',
      section3Content: 'Users are assigned roles (Photographer, Publisher, or Admin) that define their permissions. Photographers and Publishers can upload photos and blog posts. Only Admins can approve, reject, or moderate content and manage user roles.',
      section4Title: '4. Content Guidelines',
      section4Content: 'All uploaded content must comply with our community guidelines. Content must not be illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. Uploaded images must be in PNG, JPG, or WEBP format and not exceed 8MB in size.',
      section5Title: '5. Content Approval',
      section5Content: 'All submitted content goes through an approval process. Only content approved by an administrator will be publicly visible. We reserve the right to reject any content that violates our guidelines, with a reason provided.',
      section6Title: '6. Event Ticketing Services',
      section6Content: 'Furban provides an event ticketing platform that allows organisers to create events and sell tickets, and allows users to purchase tickets and attend events. By using the ticketing service, you agree to the following: tickets are issued only after successful payment confirmation; each ticket is personal and non-transferable unless authorised by the event organiser; ticket availability is subject to quota limits which may be adjusted by the organiser at any time; the organiser reserves the right to limit ticket sales, modify event schedules, change venue, or alter event programming.',
      section7Title: '7. Ticket Purchase, Payment & Refunds',
      section7Content: 'Ticket numbers are assigned only after payment is verified. Unpaid tickets will expire automatically after the designated claim window. If an event is cancelled by the organiser, ticket holders are entitled to a full refund. Attendee-initiated cancellations are subject to the organiser\'s refund policy. No-shows are not eligible for refunds. All payment information is processed securely through the platform.',
      section8Title: '8. Right to Revoke Tickets',
      section8Content: 'The organiser and/or Furban reserve the right to revoke any ticket if the attendee: provided false or fraudulent personal information; engaged in ticket scalping, resale, or unauthorised transfer; violated the event\'s code of conduct or community guidelines; engaged in harassment, threats, or any form of misconduct; attempted to circumvent security measures, forge QR codes, or duplicate tickets; or was found on the event\'s moderation or ban list. Revoked tickets are void and non-refundable.',
      section9Title: '9. Malpractice & Fraud Prevention',
      section9Content: 'Any attempt to manipulate the ticketing system — including automated bulk purchasing, QR code forgery, account impersonation, or exploitation of system vulnerabilities — is strictly prohibited. The platform employs rate limiting, moderation lists, and verification mechanisms to detect and prevent fraud. Circumventing these security measures is a serious violation of these terms.',
      section10Title: '10. Enforcement & Account Consequences',
      section10Content: 'Failure to comply with these Terms of Service may result in escalating consequences at the sole discretion of the organiser or platform administrators: (a) Warning and notation on the user\'s account; (b) Immediate ticket revocation without refund; (c) Denial of entry or removal from an event; (d) Temporary suspension of the user\'s Furban account; (e) Permanent deregistration (ban) of the user\'s account on the Furban platform. The platform reserves the right to report illegal activities to the appropriate authorities.',
      section11Title: '11. Intellectual Property',
      section11Content: 'You retain ownership of the content you upload. By uploading content, you grant Furban a non-exclusive license to display and distribute your content on the platform. You must only upload content you have the right to share.',
      section12Title: '12. Prohibited Conduct',
      section12Content: 'You may not: attempt to gain unauthorised access to other accounts or systems; upload malicious files; circumvent the content approval process or ticketing security mechanisms; impersonate others; engage in ticket scalping or fraudulent transactions; or use the platform for any unlawful purpose.',
      section13Title: '13. Termination',
      section13Content: 'We reserve the right to suspend or terminate accounts that violate these terms. Accounts involved in ticketing fraud, malpractice, or repeated violations may be permanently deregistered without prior notice. You may also request deletion of your account by contacting us.',
      section14Title: '14. Limitation of Liability',
      section14Content: 'Furban is provided "as is" without warranties of any kind. We are not liable for any damages resulting from the use or inability to use the platform, including but not limited to event cancellations, denied entry, or ticket revocation resulting from a user\'s violation of these terms. Attendance at events is at the user\'s own risk.',
      section15Title: '15. Changes to Terms',
      section15Content: 'We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. For material changes affecting existing ticket holders, we will provide reasonable notice through the platform.',
      section16Title: '16. Contact',
      section16Content: 'For questions about these terms, contact us at contact@furban.my.id.'
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions about Furban.',
      q1: 'What is Furban?',
      a1: 'Furban (Furry Bandung) is a regional community for fans of furry culture in the Bandung area and surroundings. We provide a space for art, costumes, and anthropomorphic character enthusiasts to connect and express themselves.',
      q2: 'How do I join the community?',
      a2: 'You can reach out to one of our admins to join the community.',
      q3: 'What is furry?',
      a3: 'Furry is a subculture community interested in anthropomorphic animal characters, that is, fictional animals that have human characteristics such as speaking, walking on two legs, and wearing clothes.',
      q4: 'Is my data safe?',
      a4: 'Yes. We use secure infrastructure powered by Cloudflare, with encrypted password storage and JWT-based authentication. Please refer to our Privacy Policy for more details.'
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
      subtitle: 'Cerita Kami',
      description1: 'Furban singkatan dari Furry Bandung merupakan bagian dari komunitas regional yang berfokus pada penggemar budaya furry di wilayah Bandung dan sekitarnya. Komunitas ini bertujuan untuk menyediakan ruang bagi individu yang tertarik pada seni, kostum, dan karakter antropomorfik untuk berkumpul, berbagi ide, dan mengekspresikan diri mereka dalam lingkungan yang ramah dan mendukung.',
      description2: 'Sejak 11 Mei 2017 hingga kini, Furban telah menampung anggota sebanyak lebih dari 100 orang yang berasal dari berbagai latar belakang yang berbeda.',
      members: 'Anggota Komunitas'
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
    },
    footer: {
      tagline: 'Furry Bandung — Komunitas regional untuk penggemar budaya furry di Bandung dan sekitarnya.',
      links: 'Tautan',
      privacyPolicy: 'Kebijakan Privasi',
      termsOfService: 'Ketentuan Layanan',
      faq: 'FAQ',
      contactAndSocials: 'Kontak & Sosial',
      comingSoon: 'Segera hadir',
      rights: 'Hak cipta dilindungi.'
    },
    privacy: {
      title: 'Kebijakan Privasi',
      lastUpdated: 'Terakhir diperbarui: 19 Februari 2026',
      intro: 'Furban ("kami") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan situs web dan layanan kami, termasuk sistem tiket acara.',
      section1Title: '1. Informasi yang Kami Kumpulkan',
      section1Content: 'Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti saat membuat akun, mengunggah konten, membeli tiket acara, atau menghubungi kami. Ini mencakup nama, alamat email, username, tanggal lahir, nomor telepon, dan konten yang Anda kirimkan (foto, posting blog, dll.).',
      section2Title: '2. Data Tiket & Acara',
      section2Content: 'Saat Anda membeli tiket untuk acara, kami mengumpulkan dan menyimpan informasi tambahan yang diperlukan untuk manajemen acara, termasuk nama lengkap, tanggal lahir, nomor telepon, preferensi makanan, status fursuiter, dan catatan transaksi pembayaran. Data ini diperlukan untuk menerbitkan tiket, memfasilitasi check-in, dan mengelola logistik acara.',
      section3Title: '3. Bagaimana Kami Menggunakan Informasi Anda',
      section3Content: 'Kami menggunakan informasi yang dikumpulkan untuk mengoperasikan dan meningkatkan platform, mengelola akun pengguna, memproses pembelian tiket dan pembayaran, memfasilitasi prosedur check-in acara, menampilkan konten yang disetujui di galeri dan blog, berkomunikasi dengan Anda tentang pembaruan dan informasi acara, mencegah penipuan dan menegakkan ketentuan kami, serta memastikan keamanan layanan kami.',
      section4Title: '4. Berbagi Data dengan Penyelenggara Acara',
      section4Content: 'Saat Anda membeli tiket, informasi pribadi Anda (nama, detail kontak, preferensi makanan) dapat dibagikan kepada penyelenggara acara semata-mata untuk tujuan manajemen acara, check-in, dan koordinasi peserta. Penyelenggara acara terikat oleh ketentuan kami untuk menangani data Anda secara bertanggung jawab dan tidak boleh membagikannya kepada pihak ketiga yang tidak berwenang.',
      section5Title: '5. Penyimpanan & Keamanan Data',
      section5Content: 'Data Anda disimpan dengan aman menggunakan infrastruktur Cloudflare (D1 untuk database, R2 untuk penyimpanan media). Kami menerapkan langkah-langkah keamanan yang sesuai termasuk autentikasi berbasis JWT, hashing kata sandi, pembatasan rate, dan sistem moderasi untuk melindungi informasi pribadi Anda dan mencegah akses tidak sah.',
      section6Title: '6. Berbagi Konten',
      section6Content: 'Konten yang Anda unggah (foto, posting blog) hanya akan terlihat secara publik setelah disetujui oleh administrator. Konten yang ditolak tidak akan ditampilkan secara publik. Anda tetap memiliki hak atas konten yang Anda buat.',
      section7Title: '7. Cookie & Penyimpanan Lokal',
      section7Content: 'Kami menggunakan penyimpanan lokal untuk mempertahankan sesi Anda (token JWT) dan preferensi (pengaturan bahasa, mode gelap). Kami tidak menggunakan cookie pelacakan pihak ketiga.',
      section8Title: '8. Retensi Data',
      section8Content: 'Data akun disimpan selama akun Anda aktif. Catatan tiket dan transaksi disimpan untuk tujuan pencatatan dan audit bahkan setelah acara selesai. Jika akun Anda dinonaktifkan karena pelanggaran ketentuan, kami dapat menyimpan catatan minimal yang diperlukan untuk penegakan dan pencegahan penipuan.',
      section9Title: '9. Hak Anda',
      section9Content: 'Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan data pribadi Anda. Anda juga dapat meminta salinan data Anda. Perhatikan bahwa penghapusan catatan transaksi tiket mungkin dibatasi oleh kewajiban hukum atau kontraktual. Hubungi kami di contact@furban.my.id untuk permintaan terkait privasi.',
      section10Title: '10. Perubahan Kebijakan Ini',
      section10Content: 'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan dengan memposting kebijakan baru di halaman ini dengan tanggal yang direvisi.',
      section11Title: '11. Kontak',
      section11Content: 'Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di contact@furban.my.id.'
    },
    terms: {
      title: 'Ketentuan Layanan',
      lastUpdated: 'Terakhir diperbarui: 19 Februari 2026',
      intro: 'Dengan mengakses atau menggunakan platform Furban, termasuk sistem tiket acara, Anda setuju untuk terikat oleh Ketentuan Layanan ini. Harap baca dengan seksama.',
      section1Title: '1. Penerimaan Ketentuan',
      section1Content: 'Dengan membuat akun, membeli tiket, atau menggunakan layanan kami, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui ketentuan ini. Jika Anda tidak setuju, harap jangan gunakan platform ini.',
      section2Title: '2. Akun Pengguna',
      section2Content: 'Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda. Anda harus memberikan informasi yang akurat saat pendaftaran dan pembelian tiket. Setiap orang hanya boleh memiliki satu akun. Memberikan informasi pribadi palsu (termasuk nama, tanggal lahir, atau detail kontak) merupakan pelanggaran terhadap ketentuan ini.',
      section3Title: '3. Peran Pengguna',
      section3Content: 'Pengguna diberikan peran (Fotografer, Penerbit, atau Admin) yang menentukan izin mereka. Fotografer dan Penerbit dapat mengunggah foto dan posting blog. Hanya Admin yang dapat menyetujui, menolak, atau memoderasi konten dan mengelola peran pengguna.',
      section4Title: '4. Pedoman Konten',
      section4Content: 'Semua konten yang diunggah harus mematuhi pedoman komunitas kami. Konten tidak boleh ilegal, berbahaya, mengancam, kasar, melecehkan, memfitnah, atau tidak pantas. Gambar yang diunggah harus dalam format PNG, JPG, atau WEBP dan tidak melebihi 8MB.',
      section5Title: '5. Persetujuan Konten',
      section5Content: 'Semua konten yang dikirimkan melalui proses persetujuan. Hanya konten yang disetujui oleh administrator yang akan terlihat secara publik. Kami berhak menolak konten yang melanggar pedoman kami, dengan alasan yang diberikan.',
      section6Title: '6. Layanan Tiket Acara',
      section6Content: 'Furban menyediakan platform tiket acara yang memungkinkan penyelenggara membuat acara dan menjual tiket, serta memungkinkan pengguna membeli tiket dan menghadiri acara. Dengan menggunakan layanan tiket, Anda setuju bahwa: tiket hanya diterbitkan setelah konfirmasi pembayaran berhasil; setiap tiket bersifat pribadi dan tidak dapat dipindahtangankan kecuali diizinkan oleh penyelenggara; ketersediaan tiket tunduk pada batas kuota yang dapat disesuaikan oleh penyelenggara kapan saja; penyelenggara berhak membatasi penjualan tiket, mengubah jadwal acara, mengubah tempat, atau mengubah program acara.',
      section7Title: '7. Pembelian Tiket, Pembayaran & Pengembalian Dana',
      section7Content: 'Nomor tiket hanya diberikan setelah pembayaran diverifikasi. Tiket yang belum dibayar akan kedaluwarsa secara otomatis setelah jendela klaim yang ditentukan. Jika acara dibatalkan oleh penyelenggara, pemegang tiket berhak atas pengembalian dana penuh. Pembatalan yang diinisiasi peserta tunduk pada kebijakan pengembalian dana penyelenggara. Ketidakhadiran tanpa pemberitahuan tidak berhak atas pengembalian dana. Semua informasi pembayaran diproses secara aman melalui platform.',
      section8Title: '8. Hak Pencabutan Tiket',
      section8Content: 'Penyelenggara dan/atau Furban berhak mencabut tiket apa pun jika peserta: memberikan informasi pribadi palsu atau curang; terlibat dalam calo tiket, penjualan kembali, atau transfer tanpa izin; melanggar kode etik acara atau pedoman komunitas; terlibat dalam pelecehan, ancaman, atau bentuk perilaku buruk apa pun; berusaha mengelabui langkah-langkah keamanan, memalsukan kode QR, atau menggandakan tiket; atau ditemukan dalam daftar moderasi atau larangan acara. Tiket yang dicabut tidak berlaku dan tidak dapat dikembalikan dananya.',
      section9Title: '9. Pencegahan Malpraktik & Penipuan',
      section9Content: 'Segala upaya untuk memanipulasi sistem tiket — termasuk pembelian massal otomatis, pemalsuan kode QR, peniruan identitas akun, atau eksploitasi kerentanan sistem — dilarang keras. Platform menggunakan pembatasan rate, daftar moderasi, dan mekanisme verifikasi untuk mendeteksi dan mencegah penipuan. Mengelabui langkah-langkah keamanan ini merupakan pelanggaran serius terhadap ketentuan ini.',
      section10Title: '10. Penegakan & Konsekuensi Akun',
      section10Content: 'Kegagalan mematuhi Ketentuan Layanan ini dapat mengakibatkan konsekuensi bertingkat atas kebijaksanaan tunggal penyelenggara atau administrator platform: (a) Peringatan dan catatan pada akun pengguna; (b) Pencabutan tiket segera tanpa pengembalian dana; (c) Penolakan masuk atau pemindahan dari acara; (d) Penangguhan sementara akun Furban pengguna; (e) Penonaktifan permanen (larangan) akun pengguna di platform Furban. Platform berhak melaporkan aktivitas ilegal kepada pihak berwenang yang berwajib.',
      section11Title: '11. Kekayaan Intelektual',
      section11Content: 'Anda tetap memiliki hak atas konten yang Anda unggah. Dengan mengunggah konten, Anda memberikan Furban lisensi non-eksklusif untuk menampilkan dan mendistribusikan konten Anda di platform. Anda hanya boleh mengunggah konten yang Anda miliki haknya.',
      section12Title: '12. Perilaku yang Dilarang',
      section12Content: 'Anda tidak boleh: mencoba mendapatkan akses tidak sah ke akun atau sistem lain; mengunggah file berbahaya; menghindari proses persetujuan konten atau mekanisme keamanan tiket; menyamar sebagai orang lain; terlibat dalam calo tiket atau transaksi curang; atau menggunakan platform untuk tujuan melanggar hukum.',
      section13Title: '13. Penghentian',
      section13Content: 'Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini. Akun yang terlibat dalam penipuan tiket, malpraktik, atau pelanggaran berulang dapat dinonaktifkan secara permanen tanpa pemberitahuan sebelumnya. Anda juga dapat meminta penghapusan akun Anda dengan menghubungi kami.',
      section14Title: '14. Batasan Tanggung Jawab',
      section14Content: 'Furban disediakan "apa adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kerugian yang diakibatkan oleh penggunaan atau ketidakmampuan menggunakan platform, termasuk namun tidak terbatas pada pembatalan acara, penolakan masuk, atau pencabutan tiket yang diakibatkan oleh pelanggaran ketentuan ini oleh pengguna. Kehadiran di acara merupakan risiko pengguna sendiri.',
      section15Title: '15. Perubahan Ketentuan',
      section15Content: 'Kami dapat mengubah ketentuan ini kapan saja. Penggunaan platform yang berkelanjutan setelah perubahan merupakan penerimaan terhadap ketentuan baru. Untuk perubahan material yang mempengaruhi pemegang tiket yang ada, kami akan memberikan pemberitahuan yang wajar melalui platform.',
      section16Title: '16. Kontak',
      section16Content: 'Untuk pertanyaan tentang ketentuan ini, hubungi kami di contact@furban.my.id.'
    },
    faq: {
      title: 'Pertanyaan yang Sering Diajukan',
      subtitle: 'Temukan jawaban untuk pertanyaan umum tentang Furban.',
      q1: 'Apa itu Furban?',
      a1: 'Furban (Furry Bandung) adalah komunitas regional untuk penggemar budaya furry di wilayah Bandung dan sekitarnya. Kami menyediakan ruang bagi penggemar seni, kostum, dan karakter antropomorfik untuk terhubung dan mengekspresikan diri.',
      q2: 'Bagaimana cara bergabung dengan komunitas?',
      a2: 'Anda dapat menghubungi salah satu admin kami untuk bergabung dengan komunitas.',
      q3: 'Apa itu furry?',
      a3: 'Furry adalah subkultur komunitas yang tertarik pada karakter hewan antropomorfik, yaitu hewan fiksi yang memiliki karakteristik manusia seperti berbicara, berjalan dengan dua kaki, dan berpakaian.',
      q4: 'Apakah data saya aman?',
      a4: 'Ya. Kami menggunakan infrastruktur aman yang didukung oleh Cloudflare, dengan penyimpanan kata sandi terenkripsi dan autentikasi berbasis JWT. Silakan lihat Kebijakan Privasi kami untuk detail lebih lanjut.'
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